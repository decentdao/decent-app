# PRD: Gasless (Sponsored) Voting Feature

## 1. Overview

This document describes the requirements and user experience workflow for the Gasless (Sponsored) Voting feature. This feature allows DAOs to sponsor the network transaction fees for their members when voting on proposals, utilizing a Paymaster contract via ERC-4337 Account Abstraction.

**Note:** This PRD describes both the current implementation and desired improvements. Sections marked `**Current Behavior:**` describe how the feature works today. Sections marked `**Desired Behavior / Issue:**` describe proposed changes or identified problems.

## 2. Goals

- Improve voter participation by removing the friction of gas fees.
- Provide DAOs with a mechanism to subsidize voting costs for their members.
- Offer a seamless UX for voters when their transaction is sponsored.
- Clearly identify areas for UX improvement in the current implementation.

## 3. User Workflows

**Architectural Note on Desired State (KV Flag Removal):** The _Current Behavior_ described below relies on a `gaslessVotingEnabled` flag stored in the DAO's `KeyValuePairs` contract to represent the DAO's intent to sponsor votes. However, analysis revealed this flag is misleading and insufficient:

- It only affects the frontend's determination of sponsorship eligibility (`canVoteForFree`).
- It does _not_ prevent users from manually constructing and submitting UserOperations to a bundler if the Paymaster contract is otherwise funded and active on-chain, as the Paymaster's `validatePaymasterUserOp` function does not check this external flag. This creates race conditions, particularly when attempting to withdraw the full deposit balance.
- It creates ambiguity between the DAO's _intent_ and the Paymaster's actual _readiness_ (deployment, funding, stake status, validator configuration).

Therefore, the **Desired Behavior / Issue** sections outlined below describe a revised model where the `KeyValuePairs` flag is **removed**. In this desired state, the UI state, available actions, and sponsorship eligibility are determined _solely_ by the Paymaster contract's verifiable on-chain status:

- Deployment status (`paymasterAddress !== null`).
- Deposit balance (`depositInfo.balance`).
- Stake lock status (`depositInfo.stake`, `depositInfo.withdrawTime`), particularly if `stakingRequired`.
- **Function Validator Registration:** Crucially, whether a valid (non-zero) validator address is registered on the Paymaster for the specific voting strategy's `vote` function selector (`paymaster.validators(strategyAddress, voteSelector) !== address(0)`). Disabling sponsorship is achieved by calling `removeFunctionValidator`, and enabling/re-enabling requires `setFunctionValidator`. If funds are staked, `unlockStake` is also needed to begin the withdrawal cooldown for those funds.

This approach provides a more accurate, secure (on-chain enforcement), and less confusing representation of the system's capabilities.

### 3.1. DAO Creator: Initial DAO Setup

This section describes the process during the initial creation of a new DAO.

- `**Current Behavior:**` During the DAO creation flow, there is **no option** to enable the Gasless (Sponsored) Voting feature. The Paymaster contract cannot be deployed and activated as part of the DAO creation transaction.
  - **Reasoning:**
    - Most networks require a minimum stake to be deposited for the Paymaster on the `EntryPoint` contract (`bundlerMinimumStake`).
    - The `EntryPoint.addStake` function requires the deposit to come from the Paymaster contract itself (`msg.sender` must be the Paymaster).
    - Our `DecentPaymasterV1.addStake` function facilitates this by forwarding `msg.value` to the `EntryPoint`, but this function is restricted by `onlyOwner`.
    - The designated owner of the Paymaster is the DAO Safe contract.
    - During the creation transaction, the DAO Safe does not yet exist and, more importantly, possesses no funds to forward as `msg.value` to the `Paymaster.addStake` function.
  - **Result:** DAO users must enable sponsored voting _after_ the DAO is created and funded, using the DAO Settings page (described in Section 3.2).
- `**Desired Behavior / Issue:**` Allow the DAO creator to optionally enable Gasless Voting during the initial DAO setup transaction, provided the network requires staking (`stakingRequired`).
  - **Workflow:**
    1.  The DAO creation UI presents an option like "Enable Sponsored Voting".
    2.  If selected **and** `stakingRequired` is true:
        - The UI calculates the `bundlerMinimumStake` required.
        - The UI informs the creator that enabling this feature requires them to send **at least** the `bundlerMinimumStake` amount as `msg.value` with the DAO creation transaction.
        - The UI explains that this value will be forwarded to the newly created DAO Safe to cover the initial Paymaster stake.
    3.  The backend transaction builder (`DaoTxBuilder` or similar) needs modification:
        - It must predict the addresses of the DAO Safe and the Paymaster contract using `CREATE2`.
        - The main multi-send transaction must be structured to ensure the `msg.value` sent by the creator is correctly received by the **predicted** DAO Safe address upon its creation.
        - Include instructions within the multi-send to deploy the Paymaster contract.
        - Include an internal transaction executed **by the predicted DAO Safe address** that calls the `addStake(bundlerMinimumStake)` function on the **predicted Paymaster address**, forwarding the required funds received from the creator's `msg.value`.
        - Include instructions to whitelist the DAO's voting strategies on the Paymaster.
  - **Complexity Note:** This significantly increases the complexity and gas cost of the initial DAO creation transaction, involving address prediction, value forwarding, and chained internal calls within a single multi-send.

### 3.2. DAO User: Managing Sponsored Voting Paymaster

**Managing Settings (Post-DAO Creation - General Settings):**

1.  **Navigation:**
    - `**Current Behavior:**` User navigates to DAO Settings -> General (`SafeGeneralSettingsPage`).
2.  **Section Visibility:**
    - `**Current Behavior:**` A "Sponsored Votes" section (`GaslessVotingToggleDAOSettings`) is visible if the feature flag `flag_gasless_voting` is active globally, AND Gasless voting is supported for the current configuration (`gaslessVotingSupported` is true - requires AA support on network and non-Multisig governance).
3.  **Scenario A: Paymaster Not Deployed (`paymasterAddress === null`)**
    - **UI State:**
      - `**Current Behavior:**` Displays a toggle reflecting the (now irrelevant) KV state. Does not clearly state Paymaster is missing.
      - `**Desired Behavior / Issue:**` Display clear status: "Sponsorship Status: Inactive (Paymaster not deployed)." No toggle shown. Show "Deploy Paymaster" button only if user has proposal rights.
    - **Available Actions (Proposal):**
      - `**Current Behavior:**` Clicking toggle ON proposes bundled deployment/KV/stake/whitelist.
      - `**Desired Behavior / Issue:**` Clicking "Deploy Paymaster" button -> Propose: [
        1. Deploy Paymaster (`deployModule`).
        2. (If `stakingRequired`) Lock Required Funds via `addStake(86400)` with `msg.value=bundlerMinimumStake`.
        3. Whitelist Strategies via `setFunctionValidator(strategy, selector, validator)`.
        4. Fund Initial Gas Tank via `depositTo(predictedPaymasterAddress, initialDepositAmount)` (requires user input for `initialDepositAmount >= 0`).
           ].
        - Add UI confirmation explaining a Paymaster deployment is being proposed, potentially including the initial fund lock if required.
        - Perform Treasury funding check before proposal creation if locking funds (`addStake`) is included.
4.  **Scenario B: Paymaster Deployed (`paymasterAddress !== null`)**
    - **Common Information Display:**
      - `**Current Behavior:**` Only displays Balance/Stake when toggle is ON. Address not shown. Stake status unclear. Validator status not shown.
      - `**Desired Behavior / Issue:**` _Always_ display the following:
        - Paymaster Address (`paymasterAddress`), linked to block explorer.
        - Current Paymaster Deposit Balance (`depositInfo.balance`) (aka "Gas Tank").
        - Funds Locked for Sponsorship (`depositInfo.stake`).
        - **Sponsorship Status:** Clearly display one of:
          - **"Active"**
            - **Conditions:** `paymaster.validators(...) != address(0)` AND (`stakingRequired == false` OR (`stakingRequired == true` AND `info.staked == true` AND `info.stake >= bundlerMinimumStake`))
            - **Meaning:** Ready for sponsorship. On-chain validation passes and bundler requirements met.
          - **"Active (Stake Issue)"**
            - **Conditions:** `paymaster.validators(...) != address(0)` AND `stakingRequired == true` AND (`info.staked == false` OR `info.stake < bundlerMinimumStake`)
            - **Meaning:** Sponsorship **passes** on-chain (validator set), but **bundlers will likely reject** due to insufficient/unlocked stake. Needs stake configuration (`addStake`/re-locking). Direct UserOp submission might still work.
          - **"Deactivating (Cooldown Active)"**
            - **Conditions:** `paymaster.validators(...) == address(0)` AND `info.withdrawTime > block.timestamp`
            - **Meaning:** Sponsorship **fails** on-chain (validator not set). Stake unlock initiated, cooldown active.
          - **"Deactivated (Ready to Withdraw Stake)"**
            - **Conditions:** `paymaster.validators(...) == address(0)` AND `info.withdrawTime > 0` AND `info.withdrawTime <= block.timestamp`
            - **Meaning:** Sponsorship **fails** on-chain (validator not set). Stake withdrawal ready.
          - **"Inactive (Validator Not Set)"**
            - **Conditions:** `paymaster.validators(...) == address(0)` AND `info.staked == false`
            - **Meaning:** Sponsorship **fails** on-chain (validator not set). Stake not in withdrawal cycle. Needs `setFunctionValidator`.
          - _**Note:** Status prioritizes on-chain possibility (Validator Set). Stake issues are secondary but critical for bundler compatibility. UI should clearly distinguish these._
            **Flowchart Representation:**
          ```mermaid
          graph TD
              A[Start: Check Paymaster Status] --> D{Validator Set?};
              D -- No --> B{withdrawTime > 0?};
              D -- Yes --> E{Staking Required?};
              B -- Yes --> C{withdrawTime <= <br/>block.timestamp?};
              B -- No --> S3[Status: Inactive: <br/>Validator Not Set];
              C -- Yes --> S5[Status: Deactivated: <br/>Ready to Withdraw Stake];
              C -- No --> S4[Status: Deactivating: <br/>Cooldown Active];
              E -- No --> S1[Status: Active];
              E -- Yes --> F{staked == true AND <br/>stake >= minStake?};
              F -- Yes --> S1;
              F -- No --> S2[Status: Active: <br/>Stake Issue];
          ```
        - **Sponsoring Functional Status:** Display "Inactive" only if Sponsorship Status is `Inactive (Validator Not Set)`, `Deactivating`, or `Deactivated`. Display "Needs Attention" or similar if `Active (Stake Issue)`. Otherwise, determined by technical readiness (sufficient **deposit** balance in gas tank).
    - **Sub-Scenario 4.1: Sponsorship Active (`paymaster.validators(...) != address(0)` AND (`stakingRequired == false` OR (`stakingRequired == true` AND `info.staked == true` AND `info.stake >= bundlerMinimumStake`)))**
      - **UI State:**
        - `**Current Behavior:**` Toggle reflects KV state. Status/sufficiency unclear unless KV `true`.
        - `**Desired Behavior / Issue:**` Display Sponsorship Status: "Active". If activation requires locked funds (`stakingRequired`), show sufficiency ("X Funds Locked / Y Required"). Buttons disabled if user lacks proposal rights.
      - **Available Actions (Proposal):**
        - `**Current Behavior:**` Toggle ON proposes KV set + stake top-up + whitelist. Toggle OFF proposes KV set to `false`. Separate Refill/Withdraw Deposit.
        - `**Desired Behavior / Issue:**` Provide explicit action buttons:
          - "Deactivate Sponsorship" -> Propose: [Call `removeFunctionValidator(...)` for all voting strategies. If `info.stake > 0`, _also_ call `unlockStake()`]. _Add UI Warning: "Turns off sponsoring immediately by removing strategy validation. If funds are staked, also starts the **[~1-day]** cooldown before locked funds can be withdrawn."_ (This replaces KV disabling).
          - **Pre-check:** Only available if `depositInfo.balance > 0`.
          - Offer "Withdraw Gas Tank" -> Propose: [Call `withdrawTo(recipient, amount)`].
          - _**Note:** It should be possible to bundle the "Withdraw Gas Tank" action (`withdrawTo`) with either "Deactivate Sponsorship" (`removeFunctionValidator` / `unlockStake`) or "Increase Locked Funds" (`addStake`) in a single proposal._
    - **Sub-Scenario 4.2: Sponsorship Active (Stake Issue) (`paymaster.validators(...) != address(0)` AND `stakingRequired == true` AND (`info.staked == false` OR `info.stake < bundlerMinimumStake`))**
      - **UI State:**
        - `**Desired Behavior / Issue:**` Display Sponsorship Status: "Active (Stake Issue)". Display **Prominent Warning:** "Sponsorship should pass on-chain, but bundlers will likely reject UserOps due to insufficient or unlocked stake. Configuration needed." Buttons disabled if user lacks proposal rights.
      - **Available Actions (Proposal):**
        - `**Desired Behavior / Issue:**`
          - (If `info.staked == false`)
            - **Pre-check:** Verify DAO Treasury balance >= `max(0, bundlerMinimumStake - info.stake)`.
            - "Re-lock Stake" -> Propose: [`addStake(currentUnstakeDelay)` with `msg.value = max(0, bundlerMinimumStake - info.stake)`]. _Explain: "Re-locks existing stake and tops up to minimum if needed. Uses the previously set unstake delay."_ (Requires fetching `unstakeDelaySec`).
          - (If `info.staked == true` AND `info.stake < bundlerMinimumStake`)
            - **Pre-check:** Verify DAO Treasury balance >= `bundlerMinimumStake - info.stake`.
            - "Increase Locked Funds" -> Propose: [`addStake(currentUnstakeDelay)` with `msg.value = bundlerMinimumStake - info.stake`]. _Explain: "Tops up locked funds to meet the minimum requirement."_
          - **Pre-check:** Only available if `depositInfo.balance > 0`.
          - Offer "Withdraw Gas Tank" -> Propose: [Call `withdrawTo(recipient, amount)`].
          - "Deactivate Sponsorship" -> Propose: [`removeFunctionValidator(...)` for all strategies. If `info.stake > 0` AND `info.staked == true`, also call `unlockStake()`]. _UI Warning as before._
          - _**Note:** Bundling "Deactivate Sponsorship" (`removeFunctionValidator`/`unlockStake`) with "Withdraw Gas Tank" (`withdrawTo`) should be possible._
    - **Sub-Scenario 4.3: Sponsorship Deactivating (Cooldown Active) (`paymaster.validators(...) == address(0)`, `info.withdrawTime > block.timestamp`)**
      - **UI State:**
        - `**Current Behavior:**` Unclear UI representation.
        - `**Desired Behavior / Issue:**` Display Sponsorship Status: **"Deactivating (Validator Removed / Cooldown Period: ~X days remaining)"**. Display **Prominent Warning: "Sponsored voting is inactive."** Buttons disabled if user lacks proposal rights.
      - **Available Actions (Proposal):**
        - `**Current Behavior:**` Unclear available actions.
        - `**Desired Behavior / Issue:**`
          - Offer "Propose Locked Funds Withdrawal" -> Propose: [Call `withdrawStake(recipient)`]. _Add UI Explanation: "Proposal execution only possible after cooldown ends (~X days remaining)."_
          - **Pre-check:** Only available if `depositInfo.balance > 0`.
          - Offer "Withdraw Gas Tank" -> Propose: [Call `withdrawTo(recipient, amount)`].
          - Offer "Reactivate Sponsorship" -> Propose: [
            1. Call `setFunctionValidator(...)`.
            2. If `stakingRequired`:
               - **Pre-check:** Verify DAO Treasury balance >= `max(0, bundlerMinimumStake - info.stake)`.
               - Call `addStake(86400)` with `msg.value = max(0, bundlerMinimumStake - info.stake)`
                 ]. _Explain: "Re-whitelists strategy validation, cancels the pending stake withdrawal, re-locks funds (potentially topping up), turning sponsorship back on."_
          - _**Note:** It should be possible to bundle "Propose Locked Funds Withdrawal" and "Withdraw Gas Tank" into a single proposal._
    - **Sub-Scenario 4.4: Sponsorship Deactivated (Ready to Withdraw Stake) (`paymaster.validators(...) == address(0)`, `info.withdrawTime > 0`, `info.withdrawTime <= block.timestamp`)**
      - **UI State:**
        - `**Current Behavior:**` Unclear UI representation.
        - `**Desired Behavior / Issue:**` Display Sponsorship Status: **"Deactivated (Ready to Withdraw Stake)"**. Display **Prominent Warning: "Sponsored voting is inactive (Validator Removed)."** Buttons disabled if user lacks proposal rights.
      - **Available Actions (Proposal):**
        - `**Current Behavior:**` Unclear available actions.
        - `**Desired Behavior / Issue:**`
          - Offer "Withdraw Locked Funds" -> Propose: [Call `withdrawStake(recipient)`].
          - Offer "Reactivate Sponsorship" -> Propose: [
            1. Call `setFunctionValidator(...)`.
            2. If `stakingRequired`:
               - **Pre-check:** Verify DAO Treasury balance >= `max(0, bundlerMinimumStake - info.stake)`.
               - Calculate `stakeDelta = max(0, bundlerMinimumStake - info.stake)`.
               - Call `addStake(86400)` with `msg.value = stakeDelta`
                 ]. _Explain: "Re-whitelists strategy validation, tops up stake to meet minimum (if required), cancels pending withdrawal, and re-locks funds using a 1-day delay, turning vote sponsoring back on."_
          - **Pre-check:** Only available if `depositInfo.balance > 0`.
          - Offer "Withdraw Gas Tank" -> Propose: [Call `withdrawTo(recipient, amount)`].
          - _**Note:** It should be possible to bundle "Withdraw Locked Funds" and "Withdraw Gas Tank" into a single proposal._
    - **Sub-Scenario 4.5: Sponsorship Inactive (Validator Not Set) (`paymaster.validators(...) == address(0)` AND `info.staked == false`)**
      - **UI State:**
        - `**Current Behavior:**` Toggle reflects KV state. Stake status implied 0. Validator status ignored.
        - `**Desired Behavior / Issue:**` Display Sponsorship Status: "Inactive (Validator Not Set)". Show warning label ("Activation Required: Set validator" or "Set validator & Lock Funds"). Buttons disabled if user lacks proposal rights.
      - **Available Actions (Proposal):**
        - `**Current Behavior:**` Toggle ON proposes KV set + Add Stake + Whitelist.
        - `**Desired Behavior / Issue:**`
          - Offer "Activate Sponsorship" -> Propose: [
            1. Call `setFunctionValidator(...)`.
            2. If `stakingRequired`: - **Pre-check:** Verify DAO Treasury balance >= `bundlerMinimumStake`. - Call `addStake(bundlerMinimumStake)` with appropriate delay (e.g., 86400).
               ].
          - **Pre-check:** Only available if `depositInfo.balance > 0`.
          - Offer "Withdraw Gas Tank" -> Propose: [Call `withdrawTo(recipient, amount)`].
5.  **Refill:**
    - `**Current Behavior:**` An "Refill" button (`addGas`) allows a user (with proposal rights for proposal method, or any user for direct deposit) to add funds to the paymaster deposit (gas tank). This button is likely only visible if the Paymaster is deployed.
      - Clicking opens a modal (`ModalType.REFILL_GAS`).
      - User enters the amount to add.
      - User chooses the method:
        - **Via Proposal:** Creates a new DAO proposal (`prepareRefillPaymasterAction`) to transfer funds from the DAO treasury to the paymaster's deposit on the EntryPoint contract. The user is navigated to the proposal creation page to submit it.
        - **Direct Deposit:** User sends funds directly from their connected wallet to the paymaster's deposit on the EntryPoint contract (`EntryPoint07Abi.depositTo`).
    - `**Desired Behavior / Issue:**` Ensure the "Refill" button is only available when the Paymaster is deployed (`paymasterAddress !== null`).

### 3.3. DAO Member: Voting on a Proposal

1.  **Navigate to Proposal:**
    - `**Current Behavior:**` User views an active proposal (`FractalProposalState.ACTIVE`).
2.  **Voting Interface (`CastVote`):**
    - `**Current Behavior:**` User interacts with the voting options (e.g., For, Against, Abstain).
3.  **System Check (Behind the Scenes):**
    - `**Current Behavior:**` The system determines if the vote can be sponsored by evaluating `canVoteForFree` in `CastVote.tsx`. This involves several checks:
      - **Global Feature Flag:** Checks if `flag_gasless_voting` is enabled globally (`useFeatureFlag`).
      - **DAO KV Setting:** Checks if the DAO has `gaslessVotingEnabled` set to `true` (on-chain state from `KeyValuePairs` via `governances` slice in `useGlobalStore`).
      - **Paymaster Readiness (via `useCastVote` -> `canCastGaslessVote` state):**
        - A `paymasterAddress` must exist for the DAO.
        - The `estimateGaslessVoteGas` function within `useCastVote` is called.
        - This function attempts to estimate the UserOperation gas cost by calling `bundlerClient.estimateUserOperationGas`.
        - **Implicit Bundler Check:** This estimation call must succeed **without throwing an error**. The system currently relies on the bundler potentially rejecting this estimation (throwing an error) if the Paymaster would fail validation later (e.g., due to insufficient **stake**, incorrect configuration, etc.). If an error occurs during estimation, `canCastGaslessVote` is set to `false`.
        - **Explicit Balance Check:** If estimation succeeds, the function fetches the Paymaster's deposit balance (`paymasterBalance`) from the EntryPoint contract.
        - It compares the fetched `paymasterBalance` to the estimated `gasCost` returned by the bundler.
        - The `canCastGaslessVote` state variable is set to `true` **only if** the estimation succeeded _and_ `paymasterBalance >= gasCost`.
      - **Final Determination:** `canVoteForFree` is ultimately `true` if and only if `gaslessFeatureEnabled && gaslessVotingEnabled && canCastGaslessVote` evaluates to `true`.
    - `**Desired Behavior / Issue:**` The determination of voting eligibility should be made proactively and explicitly within the frontend based on the Paymaster's actual state and balance.
      1.  **Check Global Feature Flag:** Verify `flag_gasless_voting` is enabled. If not, sponsorship is unavailable.
      2.  **Check Paymaster Deployment:** Verify a `paymasterAddress` exists for the DAO. If not, sponsorship is unavailable.
      3.  **Determine Paymaster Sponsorship Status:** Use the logic defined in Section 3.2.4 (based on validator status, `DepositInfo`, `stakingRequired`, etc.) to determine the current status (e.g., "Active", "Active (Stake Issue)", "Inactive (Validator Not Set)", "Deactivating", "Deactivated").
      4.  **Eligibility Check:**
          - **If Sponsorship Status is exactly `"Active"`:**
            - Attempt to estimate the gas cost (`estimatedGasCost`) for the specific vote UserOperation.
            - Fetch the current Paymaster deposit balance (`depositInfo.balance`).
            - Compare balance to cost (`depositInfo.balance >= estimatedGasCost`).
          - **If Sponsorship Status is _not_ `"Active"`:** Sponsorship is considered unavailable for this vote.
4.  **Determine Voting Experience:**
    - `**Current Behavior:**`
      - **Sponsored Path (`canVoteForFree` is true):**
        - User selects their vote choice.
        - User clicks the "Vote" button.
        - The `castGaslessVote` function is called.
        - The user is prompted to sign a UserOperation via their wallet.
        - The signed UserOperation is sent to the bundler (`bundlerClient.sendUserOperation`).
        - The bundler includes the transaction on-chain, with the Paymaster covering the gas fees.
        - On successful inclusion, a confirmation modal is shown (`ModalType.GASLESS_VOTE_SUCCESS`) indicating the vote was sponsored ("Your vote is sponsored.").
        - If the user rejects the signature request (`UserRejectedRequestError`), an error message is shown via toast.
        - **Fallback on Error:** If another error occurs during the gasless submission process (e.g., bundler error, paymaster validation fails), an error toast appears (`castVoteError`), and the system automatically attempts to fall back to the standard voting path after a 5-second delay (`setTimeout(() => { castVote(...) }, 5000)`).
      - **Standard Path (`canVoteForFree` is false):**
        - User selects their vote choice.
        - The button simply says "Vote" (without the "for free" indication).
        - User clicks the "Vote" button.
        - The standard `castVote` function is called.
        - The user is prompted to sign and send a standard blockchain transaction via their wallet, paying the associated gas fee themselves.
        - The UI does not proactively explain _why_ sponsoring is unavailable; the user only sees the standard voting option.
    - `**Desired Behavior / Issue:**` Based on the checks above, the UI presents the appropriate voting option and handles the submission:
      - **Scenario A: Sponsorship Status == "Active"**
        - **Sub-Scenario A.1: Sufficient Balance (`depositInfo.balance >= estimatedGasCost`)**
          - **UI:** Show "Vote for Free" button.
          - **Action:** User clicks -> Proceed with `castGaslessVote` flow:
            - User signs UserOperation.
            - Submit UserOp to bundler.
            - Show pending modal.
            - On confirmation, show success modal.
          - **Error Handling:** If `castGaslessVote` fails post-submission (bundler/paymaster error), display error modal with option to retry via standard tx.
        - **Sub-Scenario A.2: Insufficient Balance (`depositInfo.balance < estimatedGasCost`)**
          - **UI:** Show standard "Vote" button. Display message: "Sponsorship is active, but the gas tank is too low for this vote. Refill via Direct Deposit possible."
          - **Action:** User clicks -> Proceed with standard `castVote` flow (User pays gas).
      - **Scenario B: Sponsorship Status != "Active"** (i.e., "Active (Stake Issue)", "Inactive (Validator Not Set)", "Deactivating", "Deactivated")
        - **UI:** Show standard "Vote" button.
        - **Action:** User clicks -> Proceed with standard `castVote` flow (User pays gas).
        - _Note: No extra explanation is given to the user about why sponsorship is unavailable in these cases._

## 4. Technical Details (High-Level)

- **Feature Flag:** `flag_gasless_voting`
- **Core Components:** `GaslessVotingToggleDAOSettings` (needs redesign -> becomes PaymasterStatus component), `CastVote` component, `useCastVote` hook, `RefillGasTankModal`.
- **Key Hooks:** `useDepositInfo`, ~~`useKeyValuePairs`~~ (KV logic removed), `useSubmitProposal`.
- **Contracts:** Paymaster (`DecentPaymasterV1` mastercopy deployed via `ZodiacModuleProxyFactory`), `EntryPoint07`, ~~`KeyValuePairs`~~ (KV logic removed), Voting Strategy Validators (`LinearERC20VotingV1ValidatorV1`, `LinearERC721VotingV1ValidatorV1`).
- **State Management:** `useDaoInfoStore` (remove `gaslessVotingEnabled` state, keep `paymasterAddress`).
- **Utils:** `gaslessVoting.ts` (e.g., `getPaymasterAddress`), `prepareRefillPaymasterActionData.ts`.
- **Backend/Infrastructure:** Relies on an ERC-4337 Bundler service (RPC endpoint configured via `rpcEndpoint`).
