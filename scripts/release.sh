#!/bin/bash
set -e

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
    set -a  # automatically export all variables
    source .env.local
    set +a  # turn off automatic export
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
VERSION_TYPE="minor"
CUSTOM_VERSION=""
BASE_BRANCH="develop"
MAIN_BRANCH="main"
PUSH_REMOTE="origin"
DRY_RUN="${DRY_RUN:-false}"

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                VERSION_TYPE="$2"
                shift 2
                ;;
            -v|--version)
                CUSTOM_VERSION="$2"
                shift 2
                ;;
            -b|--base)
                BASE_BRANCH="$2"
                shift 2
                ;;
            -m|--main)
                MAIN_BRANCH="$2"
                shift 2
                ;;
            -r|--remote)
                PUSH_REMOTE="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Release script for automated version bumping and PR creation.

OPTIONS:
    -t, --type TYPE         Version bump type: patch, minor, major (default: minor)
    -v, --version VERSION   Custom version (e.g., 1.2.3) - overrides --type
    -b, --base BRANCH       Base branch to cut release from (default: develop)
    -m, --main BRANCH       Main branch to release into (default: main)
    -r, --remote REMOTE     Remote to push to (default: origin)
    --dry-run              Show what would be done without executing
    -h, --help             Show this help message

EXAMPLES:
    $0                                    # Minor release using defaults
    $0 --type patch                       # Patch release
    $0 --version 2.1.0                    # Custom version
    $0 --remote fork                      # Push to fork remote
    $0 --type major --remote fork --dry-run  # Dry run major release to fork

ENVIRONMENT:
    DEEPL_API_KEY          DeepL API key for localization (loaded from .env.local if present)
    DRY_RUN               Set to 'true' to enable dry run mode
EOF
}

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check for required commands
    for cmd in git node npm gh; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is required but not installed."
            exit 1
        fi
    done
    
    # Check if gh is authenticated
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated. Run 'gh auth login'"
        exit 1
    fi
    
    log_info "All dependencies satisfied"
}

get_latest_release() {
    local latest_release=$(gh release list --limit 1 --json tagName --jq '.[0].tagName' 2>/dev/null || echo "")
    if [ -z "$latest_release" ]; then
        # Fallback to git tags if no GitHub releases
        latest_release=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    fi
    echo "$latest_release"
}

check_for_changes() {
    local latest_release="$1"
    
    if [ -z "$latest_release" ]; then
        log_info "No previous releases found, proceeding with release"
        return 0
    fi
    
    local commits_since=$(git rev-list ${latest_release}..${BASE_BRANCH} --count 2>/dev/null || echo "0")
    log_info "Found $commits_since commits since $latest_release"
    
    if [ "$commits_since" -gt "0" ]; then
        return 0
    else
        log_warning "No changes since last release"
        return 1
    fi
}

calculate_next_version() {
    local current_version=$(node -p "require('./package.json').version")
    echo "[INFO] Current version: $current_version" >&2
    
    local next_version=""
    
    if [ -n "$CUSTOM_VERSION" ]; then
        # Validate custom version format
        if [[ $CUSTOM_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            next_version="$CUSTOM_VERSION"
        else
            echo "[ERROR] Invalid version format: $CUSTOM_VERSION (expected X.Y.Z)" >&2
            exit 1
        fi
    else
        # Calculate next version based on type
        case "$VERSION_TYPE" in
            patch)
                next_version=$(node -e "const [x,y,z]=require('./package.json').version.split('.').map(Number); console.log([x,y,z+1].join('.'))")
                ;;
            minor)
                next_version=$(node -e "const [x,y]=require('./package.json').version.split('.').map(Number); console.log([x,y+1,0].join('.'))")
                ;;
            major)
                next_version=$(node -e "const [x]=require('./package.json').version.split('.').map(Number); console.log([x+1,0,0].join('.'))")
                ;;
            *)
                echo "[ERROR] Unknown version type: $VERSION_TYPE" >&2
                exit 1
                ;;
        esac
    fi
    
    echo "$next_version"
}

create_release_branch() {
    local version="$1"
    local branch_name="release/v${version}"
    
    echo "[INFO] Creating release branch: $branch_name" >&2
    
    if [ "$DRY_RUN" == "true" ]; then
        echo "[INFO] [DRY RUN] Would create branch: $branch_name" >&2
        echo "$branch_name"
        return
    fi
    
    # Make sure we're on the latest base branch
    git checkout "$BASE_BRANCH" >/dev/null 2>&1
    git pull origin "$BASE_BRANCH" >/dev/null 2>&1
    
    # Create and checkout release branch
    git checkout -b "$branch_name" >/dev/null 2>&1
    
    echo "$branch_name"
}

bump_version() {
    local version="$1"
    
    log_info "Bumping version to $version"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_info "[DRY RUN] Would bump version to $version"
        return
    fi
    
    npm version "$version" --no-git-tag-version
    
    git add package.json package-lock.json
    git commit -m "chore(release): v${version}"
}

run_localization() {
    if [ -n "$DEEPL_API_KEY" ]; then
        log_info "Running localization..."
        
        if [ "$DRY_RUN" == "true" ]; then
            log_info "[DRY RUN] Would run localization"
            return
        fi
        
        npm run localize || {
            log_warning "Localization failed, continuing without it"
            return 0
        }
        
        if [ -n "$(git status --porcelain)" ]; then
            git add -A
            git commit -m "localize" || log_info "No localization changes to commit"
            log_info "Committed localization changes"
        else
            log_info "No localization changes to commit"
        fi
    else
        log_warning "DEEPL_API_KEY not set, skipping localization"
    fi
}

push_release_branch() {
    local branch_name="$1"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_info "[DRY RUN] Would push branch: $branch_name to $PUSH_REMOTE"
    else
        log_info "Pushing release branch to $PUSH_REMOTE..."
        git push "$PUSH_REMOTE" "$branch_name"
    fi
}

get_commit_summary() {
    local latest_release="$1"
    local range=""
    
    if [ -z "$latest_release" ]; then
        range="$BASE_BRANCH"
    else
        range="${latest_release}..${BASE_BRANCH}"
    fi
    
    # Get commits
    local commits=$(git log $range --oneline --pretty=format:"- %s (%h)" | head -50)
    
    # Get Linear issues
    local linear_issues=$(git log $range --grep='[A-Z]\+-[0-9]\+' --oneline | \
        grep -Eo '[A-Z]+-[0-9]+' | sort -u | head -20 || true)
    
    echo -e "### Commits\n$commits\n\n### Linear Issues\n$linear_issues"
}

create_pull_requests() {
    local version="$1"
    local branch_name="$2"
    local latest_release="$3"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_info "[DRY RUN] Would create PRs for version $version"
        return
    fi
    
    # Get commit summary for PR body
    local summary=$(get_commit_summary "$latest_release")
    
    # Create PR to main
    log_info "Creating PR to $MAIN_BRANCH..."
    local main_pr_body="## Release v${version}

**Automated release created on $(date '+%Y-%m-%d')**

${summary}

---
*This PR was automatically created by the release script.*"
    
    gh pr create \
        --title "Release v${version}" \
        --body "$main_pr_body" \
        --base "$MAIN_BRANCH" \
        --head "$branch_name" || {
            log_error "Failed to create PR to $MAIN_BRANCH"
            return 1
        }
    
    # Create PR to develop
    log_info "Creating PR to $BASE_BRANCH..."
    gh pr create \
        --title "Merge release v${version} into $BASE_BRANCH" \
        --body "Automated PR to merge release changes back into $BASE_BRANCH branch." \
        --base "$BASE_BRANCH" \
        --head "$branch_name" || {
            log_error "Failed to create PR to $BASE_BRANCH"
            return 1
        }
}

wait_for_approval() {
    local version="$1"
    local branch_name="$2"
    
    log_info "Waiting for main PR to be merged..."
    log_info "Please review and merge the PR to $MAIN_BRANCH"
    
    # If running in CI, poll for merge
    if [ -n "$GITHUB_ACTIONS" ]; then
        local pr_number=$(gh pr list --head "$branch_name" --base "$MAIN_BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
        
        if [ -z "$pr_number" ]; then
            log_error "Could not find PR to $MAIN_BRANCH"
            return 1
        fi
        
        log_info "Monitoring PR #$pr_number..."
        
        for i in {1..30}; do
            local pr_state=$(gh pr view $pr_number --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")
            
            if [ "$pr_state" = "MERGED" ]; then
                log_info "PR has been merged!"
                return 0
            elif [ "$pr_state" = "CLOSED" ]; then
                log_error "PR was closed without merging"
                return 1
            fi
            
            if [ $i -lt 30 ]; then
                log_info "Waiting for PR to be merged (attempt $i/30)..."
                sleep 60
            else
                log_error "Timeout waiting for PR to be merged"
                return 1
            fi
        done
    else
        # Interactive prompt when running locally
        read -p "Press Enter after merging the main PR to continue..."
    fi
}

create_tag_and_release() {
    local version="$1"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_info "[DRY RUN] Would create tag and release for v${version}"
        return
    fi
    
    log_info "Creating tag and GitHub release..."
    
    # Pull latest main
    git checkout "$MAIN_BRANCH"
    git pull origin "$MAIN_BRANCH"
    
    # Create and push tag
    git tag -a "v${version}" -m "Release v${version}"
    git push "$PUSH_REMOTE" "v${version}"
    
    # Create GitHub release
    gh release create "v${version}" \
        --title "Release v${version}" \
        --generate-notes \
        --latest || {
            log_warning "Failed to create GitHub release, but tag was created"
        }
}

merge_develop_pr() {
    local version="$1"
    local branch_name="$2"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_info "[DRY RUN] Would merge develop PR"
        return
    fi
    
    log_info "Attempting to merge develop PR..."
    
    local pr_number=$(gh pr list --head "$branch_name" --base "$BASE_BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
    
    if [ -z "$pr_number" ]; then
        log_warning "No develop PR found to merge"
        return
    fi
    
    local mergeable=$(gh pr view $pr_number --json mergeable --jq '.mergeable' 2>/dev/null || echo "UNKNOWN")
    
    if [ "$mergeable" = "MERGEABLE" ]; then
        log_info "Auto-merging develop PR #$pr_number..."
        gh pr merge $pr_number --merge --delete-branch || {
            log_warning "Failed to auto-merge develop PR"
        }
    else
        log_warning "Develop PR has conflicts and requires manual intervention"
        gh pr comment $pr_number --body "⚠️ This PR has merge conflicts and requires manual resolution." 2>/dev/null || true
    fi
}

cleanup() {
    log_info "Cleaning up..."
    git checkout "$BASE_BRANCH" 2>/dev/null || true
}

# Main execution
main() {
    # Parse command line arguments first
    parse_args "$@"
    
    log_info "Starting release process..."
    log_info "Version type: $VERSION_TYPE"
    log_info "Base branch: $BASE_BRANCH"
    log_info "Main branch: $MAIN_BRANCH"
    log_info "Push remote: $PUSH_REMOTE"
    
    # Setup trap for cleanup
    trap cleanup EXIT
    
    # Check dependencies
    check_dependencies
    
    # Make sure we're on the base branch first
    if [ "$DRY_RUN" != "true" ]; then
        git checkout "$BASE_BRANCH"
        git pull origin "$BASE_BRANCH"
    fi
    
    # Run localization early (on base branch before creating release branch)
    run_localization
    
    # Get latest release
    local latest_release=$(get_latest_release)
    log_info "Latest release: ${latest_release:-none}"
    
    # Check for changes
    if ! check_for_changes "$latest_release"; then
        log_warning "No changes to release. Exiting."
        exit 0
    fi
    
    # Calculate next version
    local next_version=$(calculate_next_version)
    log_info "Next version: $next_version"
    
    # Create release branch
    local branch_name=$(create_release_branch "$next_version")
    
    # Bump version
    bump_version "$next_version"
    
    # Push release branch
    push_release_branch "$branch_name"
    
    # Create PRs
    create_pull_requests "$next_version" "$branch_name" "$latest_release"
    
    # Wait for approval and merge
    if wait_for_approval "$next_version" "$branch_name"; then
        # Create tag and release
        create_tag_and_release "$next_version"
        
        # Merge develop PR
        merge_develop_pr "$next_version" "$branch_name"
        
        log_info "✅ Release v${next_version} completed successfully!"
    else
        log_error "Release process was interrupted"
        exit 1
    fi
}

# Run main function
main "$@"
