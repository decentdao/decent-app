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
- `**Desired Behavior / Issue:**` Allow the DAO creator to optionally enable Gasless Voting during the initial DAO setup transaction, provided the network requires staking (`stakingRequired`). (See Issue #28)
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
      - `**Desired Behavior / Issue:**` Display clear status: "Sponsorship Status: Inactive (Paymaster not deployed)." No toggle shown. Show "Deploy Paymaster" button only if user has proposal rights. (See Issue #1)
    - **Available Actions (Proposal):**
      - `**Current Behavior:**` Clicking toggle ON proposes bundled deployment/KV/stake/whitelist.
      - `**Desired Behavior / Issue:**` Clicking "Deploy Paymaster" button -> Propose: [
        1. Deploy Paymaster (`deployModule`).
        2. (If `stakingRequired`) Lock Required Funds via `addStake(86400)` with `msg.value=bundlerMinimumStake`.
        3. Whitelist Strategies via `setFunctionValidator(strategy, selector, validator)`.
        4. Fund Initial Gas Tank via `depositTo(predictedPaymasterAddress, initialDepositAmount)` (requires user input for `initialDepositAmount >= 0`).
           ]. (See Issue #2)
        - Add UI confirmation explaining a Paymaster deployment is being proposed, potentially including the initial fund lock if required. (See Issue #3)
        - Perform Treasury funding check before proposal creation if locking funds (`addStake`) is included. (See Issue #4)
4.  **Scenario B: Paymaster Deployed (`paymasterAddress !== null`)**
    - **Common Information Display:**
      - `**Current Behavior:**` Only displays Balance/Stake when toggle is ON. Address not shown. Stake status unclear. Validator status not shown.
      - `**Desired Behavior / Issue:**` (See Issue #5) _Always_ display the following:
        - Paymaster Address (`paymasterAddress`), linked to block explorer.
        - Current Paymaster Deposit Balance (`depositInfo.balance`) (aka "Gas Tank").
        - Funds Locked for Sponsorship (`depositInfo.stake`).
        - **Sponsorship Status:** Clearly display one of:
          - "Active" (Validator set, sufficient stake if required, lock inactive)
          - "Inactive (Activation Required)" Conditions: (Validator not set) OR (`stakingRequired` is true AND `stake < bundlerMinimumStake`) OR (`stakingRequired` is true AND `withdrawTime != 0`)
          - "Deactivating (Validator Removed / Cooldown Period: ~X days remaining)" (Validator removed, `withdrawTime > 0`)
          - "Deactivated (Validator Removed / Locked Funds Ready for Withdrawal)" (Validator removed, `withdrawTime > 0`, cooldown passed)
          - _Determined based on `paymaster.validators(strategy, selector)`, `stake`, `withdrawTime`, `block.timestamp`, and `bundlerMinimumStake` (if `stakingRequired`)._
        - **Sponsoring Functional Status:** Display "Inactive" if Sponsorship Status is Deactivating, Deactivated, or Inactive (Activation Required). Otherwise, determined by technical readiness (sufficient deposit/locked funds).
    - **Sub-Scenario 4.1: Sponsorship Active (`paymaster.validators(strategy, selector) !== address(0)`, `withdrawTime === 0`, AND (IF `stakingRequired`, THEN `stake >= bundlerMinimumStake`))**
      - **UI State:**
        - `**Current Behavior:**` Toggle reflects KV state. Status/sufficiency unclear unless KV `true`.
        - `**Desired Behavior / Issue:**` Display Sponsorship Status: "Active". If activation requires locked funds (`stakingRequired`), show sufficiency ("X Funds Locked / Y Required"). Buttons disabled if user lacks proposal rights. (See Issue #6)
      - **Available Actions (Proposal):**
        - `**Current Behavior:**` Toggle ON proposes KV set + stake top-up + whitelist. Toggle OFF proposes KV set to `false`. Separate Refill/Withdraw Deposit.
        - `**Desired Behavior / Issue:**` Provide explicit action buttons:
          - "Deactivate Sponsorship" -> Propose: [Call `removeFunctionValidator(strategy, selector)` for all voting strategies. If `stake > 0`, _also_ call `unlockStake()`]. _Add UI Warning: "Turns off sponsoring immediately by removing strategy validation. If funds are staked, also starts the **[~7-day]** cooldown before locked funds can be withdrawn."_ (This replaces KV disabling). (See Issue #7)
          - (If activation requires locked funds and `lockedFunds < bundlerMinimumStake`) "Increase Locked Funds" -> Propose: [Increase lock via `addStake(delta)`]. (See Issue #8)
          - "Withdraw Gas Tank" -> Propose: [Call `withdrawTo(recipient, amount)`].
          - _**Note:** It should be possible to bundle the "Withdraw Gas Tank" action (`withdrawTo`) with either "Deactivate Sponsorship" (`removeFunctionValidator` / `unlockStake`) or "Increase Locked Funds" (`addStake`) in a single proposal._ (See Issue #9)
    - **Sub-Scenario 4.2: Sponsorship Deactivating (Validator Removed / Cooldown Period Active) (`paymaster.validators(strategy, selector) === address(0)`, `lockedFunds > 0`, `withdrawTime > 0`, `block.timestamp < withdrawTime`)**
      - **UI State:**
        - `**Current Behavior:**` Unclear UI representation.
        - `**Desired Behavior / Issue:**` Display Sponsorship Status: **"Deactivating (Validator Removed / Cooldown Period: ~X days remaining)"**. Display **Prominent Warning: "Sponsored voting is inactive."** Buttons disabled if user lacks proposal rights. (See Issue #10)
      - **Available Actions (Proposal):**
        - `**Current Behavior:**` Unclear available actions.
        - `**Desired Behavior / Issue:**`
          - Offer "Propose Locked Funds Withdrawal" -> Propose: [Call `withdrawStake(recipient)`]. _Add UI Explanation: "Proposal execution only possible after cooldown ends (~X days remaining)."_ (See Issue #11)
          - Offer "Withdraw Gas Tank" -> Propose: [Call `withdrawTo(recipient, amount)`].
          - _**Note:** It should be possible to bundle "Propose Locked Funds Withdrawal" and "Withdraw Gas Tank" into a single proposal._ (See Issue #12)
          - _Disable_ actions related to activating/deactivating sponsorship or increasing locked funds. (Reactivation requires `setFunctionValidator` first). (See Issue #13)
    - **Sub-Scenario 4.3: Sponsorship Deactivated (Validator Removed / Locked Funds Ready for Withdrawal) (`paymaster.validators(strategy, selector) === address(0)`, `lockedFunds > 0`, `withdrawTime > 0`, `block.timestamp >= withdrawTime`)**
      - **UI State:**
        - `**Current Behavior:**` Unclear UI representation.
        - `**Desired Behavior / Issue:**` Display Sponsorship Status: **"Deactivated (Validator Removed / Locked Funds Ready for Withdrawal)"**. Display **Prominent Warning: "Sponsored voting is inactive."** Buttons disabled if user lacks proposal rights. (See Issue #14)
      - **Available Actions (Proposal):**
        - `**Current Behavior:**` Unclear available actions.
        - `**Desired Behavior / Issue:**`
          - Offer "Withdraw Locked Funds" -> Propose: [Call `withdrawStake(recipient)`]. (See Issue #15)
          - Offer "Reactivate Sponsorship" -> Propose: [
            1. Call `setFunctionValidator(strategy, selector, validatorAddress)`.
            2. If `stake > 0`:
               Calculate `stakeDelta = max(0, (stakingRequired ? bundlerMinimumStake : 0) - currentStake)`.
               Call `addStake(86400)` with `msg.value = stakeDelta`
               ]. _Explain: "Re-whitelists strategy validation, tops up stake to meet minimum (if required), and re-locks funds using a 1-day delay, turning vote sponsoring back on."_ (See Issue #16)
          - Offer "Withdraw Gas Tank" -> Propose: [Call `withdrawTo(recipient, amount)`].
          - _**Note:** It should be possible to bundle "Withdraw Locked Funds" and "Withdraw Gas Tank" into a single proposal._ (See Issue #17)
          - _Disable_ actions related to increasing locked funds or deactivating sponsorship (already deactivated). (See Issue #18)
    - **Sub-Scenario 4.4: Sponsorship Inactive (Validator Not Set / Activation Potentially Required) (`paymaster.validators(strategy, selector) === address(0)`, `lockedFunds === 0` or `stakingRequired` is false)**
      - **UI State:**
        - `**Current Behavior:**` Toggle reflects KV state. Stake status implied 0. Validator status ignored.
        - `**Desired Behavior / Issue:**` Display Sponsorship Status: "Inactive". Show warning label ("Activation Required: Whitelist strategy" or "Whitelist strategy & Lock Funds"). Buttons disabled if user lacks proposal rights. (See Issue #19)
      - **Available Actions (Proposal):**
        - `**Current Behavior:**` Toggle ON proposes KV set + Add Stake + Whitelist.
        - `**Desired Behavior / Issue:**`
          - Offer "Activate Sponsorship" -> Propose: [Call `setFunctionValidator(strategy, selector, validatorAddress)`. If activation requires locking funds (`stakingRequired`), _also_ call `addStake(bundlerMinimumStake)`]. (See Issue #20)
          - (If activation does _not_ require locked funds, i.e. `!stakingRequired`) _Confirm:_ Paymaster works with 0 locked funds. If yes, only `setFunctionValidator` is needed. (See Issue #21)
          - Offer "Withdraw Gas Tank" -> Propose: [Call `withdrawTo(recipient, amount)`].
5.  **Refill:** (This remains largely the same, renumbered)
    - `**Current Behavior:**` An "Refill" button (`addGas`) allows a user (with proposal rights for proposal method, or any user for direct deposit) to add funds to the paymaster deposit (gas tank). This button is likely only visible if the Paymaster is deployed.
      - Clicking opens a modal (`ModalType.REFILL_GAS`).
      - User enters the amount to add.
      - User chooses the method:
        - **Via Proposal:** Creates a new DAO proposal (`prepareRefillPaymasterAction`) to transfer funds from the DAO treasury to the paymaster's deposit on the EntryPoint contract. The user is navigated to the proposal creation page to submit it.
        - **Direct Deposit:** User sends funds directly from their connected wallet to the paymaster's deposit on the EntryPoint contract (`EntryPoint07Abi.depositTo`).
    - `**Desired Behavior / Issue:**` Ensure the "Refill" button is only available when the Paymaster is deployed (`paymasterAddress !== null`). (See Issue #22)

### 3.3. DAO Member: Voting on a Proposal

1.  **Navigate to Proposal:**
    - `**Current Behavior:**` User views an active proposal (`FractalProposalState.ACTIVE`).
2.  **Voting Interface (`CastVote`):**
    - `**Current Behavior:**` User interacts with the voting options (e.g., For, Against, Abstain).
3.  **System Check (Behind the Scenes):**
    - `**Current Behavior:**` The system determines if the vote can be sponsored by evaluating `canVoteForFree` in `CastVote.tsx`. This involves several checks:
      - **Global Feature Flag:** Checks if `flag_gasless_voting` is enabled globally (`useFeatureFlag`).
      - **DAO KV Setting:** Checks if the DAO has `gaslessVotingEnabled` set to `true` (on-chain state from `KeyValuePairs` via `useDaoInfoStore`).
      - **Paymaster Readiness (via `useCastVote` -> `canCastGaslessVote` state):**
        - A `paymasterAddress` must exist for the DAO.
        - The `estimateGaslessVoteGas` function within `useCastVote` is called.
        - This function attempts to estimate the UserOperation gas cost by calling `bundlerClient.estimateUserOperationGas`.
        - **Implicit Bundler Check:** This estimation call must succeed **without throwing an error**. The system currently relies on the bundler potentially rejecting this estimation (throwing an error) if the Paymaster would fail validation later (e.g., due to insufficient **stake**, incorrect configuration, etc.). If an error occurs during estimation, `canCastGaslessVote` is set to `false`.
        - **Explicit Balance Check:** If estimation succeeds, the function fetches the Paymaster's deposit balance (`paymasterBalance`) from the EntryPoint contract.
        - It compares the fetched `paymasterBalance` to the estimated `gasCost` returned by the bundler.
        - The `canCastGaslessVote` state variable is set to `true` **only if** the estimation succeeded _and_ `paymasterBalance >= gasCost`.
      - **Final Determination:** `canVoteForFree` is ultimately `true` if and only if `gaslessFeatureEnabled && gaslessVotingEnabled && canCastGaslessVote` evaluates to `true`.
    - `**Desired Behavior / Issue:**` (See Issue #23) The determination of `canVoteForFree` should be made proactively and explicitly within the frontend, based on verifiable on-chain data, before attempting gas estimation. The process should be:
      1.  **Check Global Feature Flag:** Verify `flag_gasless_voting` is enabled. If not, result is `false`.
      2.  **Check Paymaster Deployment:** Verify a `paymasterAddress` exists for the DAO (via `useDaoInfoStore` or `getPaymasterAddress`). If not, result is `false`.
      3.  **Check Strategy Validator:** Verify that the expected validator is registered for the voting strategy's function selector: `paymaster.validators(strategyAddress, voteSelector)` must return the _expected_, non-zero `validatorAddress`. If it's `address(0)` (or unexpected), result is `false`.
      4.  **Fetch Paymaster Status:** Retrieve the Paymaster's deposit and lock/stake information (`depositInfo` containing `balance`, `stake`, `withdrawTime` via `useDepositInfo`) and the network's `bundlerMinimumStake` (if `stakingRequired`).
      5.  **Verify Sponsorship Stake/Lock Status:** Check if the Paymaster's stake/lock status allows sponsoring:
          - **If Fund Locking Required** (`stakingRequired` is true AND `bundlerMinimumStake > 0`):
            - Check if `depositInfo.stake >= bundlerMinimumStake`.
            - Check if the lock is active (`depositInfo.withdrawTime === 0`).
            - If either of these fails, result is `false`.
          - **If Fund Locking Not Required:** This check is implicitly passed.
      6.  **Estimate Gas Cost:** **Only if all preceding checks passed**, attempt to estimate the gas cost (`estimatedGasCost`) for the specific vote UserOperation (e.g., using a modified `prepareGaslessVoteOperation` logic).
          - If this estimation fails for reasons other than predictable Paymaster status issues (which should have been caught above), handle the error appropriately (perhaps indicate temporary network issue, but still result in `false` for `canVoteForFree`).
      7.  **Check Deposit Balance:** Compare the fetched `depositInfo.balance` against the `estimatedGasCost` from the successful estimation.
      8.  **Final Determination:** `canVoteForFree` is `true` **if and only if** the global flag is enabled (1), Paymaster is deployed (2), the correct Strategy Validator is set (3), Sponsorship Stake/Lock Status is valid (5), gas estimation succeeded (6), AND the deposit balance is sufficient (`depositInfo.balance >= estimatedGasCost`) (7). This determination avoids reliance on the deprecated KV flag and implicit bundler error handling for Paymaster status checks.
4.  **Determine Voting Path:**
    - **Sponsored Path (`canVoteForFree` is true):**
      - `**Current Behavior:**`
        - User selects their vote choice.
        - User clicks the "Vote" button.
        - The `castGaslessVote` function is called.
        - The user is prompted to sign a UserOperation via their wallet.
        - The signed UserOperation is sent to the bundler (`bundlerClient.sendUserOperation`).
        - The bundler includes the transaction on-chain, with the Paymaster covering the gas fees.
        - On successful inclusion, a confirmation modal is shown (`ModalType.GASLESS_VOTE_SUCCESS`) indicating the vote was sponsored ("Your vote is sponsored.").
        - If the user rejects the signature request (`UserRejectedRequestError`), an error message is shown via toast.
        - **Fallback on Error:** If another error occurs during the gasless submission process (e.g., bundler error, paymaster validation fails), an error toast appears (`castVoteError`), and the system automatically attempts to fall back to the standard voting path after a 5-second delay (`setTimeout(() => { castVote(...) }, 5000)`).
      - `**Desired Behavior / Issue:**` The fallback UX needs improvement. The 5-second automatic retry after a generic error toast is confusing. Instead:
        - Communicate the failure clearly to the user, explaining _why_ if possible (e.g., "Sponsored vote failed: Paymaster out of funds", "Sponsored vote failed: Network congestion").
        - Explicitly ask the user if they want to proceed by submitting a standard transaction (paying their own gas). Avoid automatic retries. (See Issue #24)
      - `**Desired Behavior / Issue:**` Improve UX around pending states (`castGaslessVotePending`) and success/failure feedback using a modal:
        - **Immediately after the user signs the UserOperation and it is submitted to the bundler:** Display a **modal** with a clear **pending state** (e.g., "Your vote is _being_ sponsored...", perhaps with a loading animation). This replaces the current behavior where a success modal only appears _after_ confirmation.
        - **On successful on-chain confirmation:** Update the modal content to a **success state** (e.g., "Your vote _was_ sponsored!", possibly with a success animation or checkmark). This leverages the existing `ModalType.GASLESS_VOTE_SUCCESS` but shows it earlier in a pending form.
        - **If an error occurs _after_ submission** (e.g., bundler error, on-chain validation failure): Update the modal to an **error state**. This modal should clearly explain the failure and present the user with the option to retry via a standard transaction (paying their own gas), replacing the confusing automatic 5-second fallback.
        - This modal-based flow provides continuous, clear feedback throughout the sponsored voting process, clearly distinguishing it from standard voting. (See Issue #25)
    - **Standard Path (`canVoteForFree` is false):**
      - `**Current Behavior:**`
        - User selects their vote choice.
        - The button simply says "Vote" (without the "for free" indication).
        - User clicks the "Vote" button.
        - The standard `castVote` function is called.
        - The user is prompted to sign and send a standard blockchain transaction via their wallet, paying the associated gas fee themselves.
        - The UI does not proactively explain _why_ sponsoring is unavailable; the user only sees the standard voting option.
      - `**Desired Behavior / Issue:**` Consider providing contextual information to the user explaining _why_ the "Vote for Free" option is not available, if the reason is known (e.g., "Sponsorship currently deactivated by DAO", "Sponsorship gas tank is low", "Network issue preventing sponsorship check"). This would improve transparency compared to simply not showing the option. (See Issue #26)

## 4. Technical Details (High-Level)

- **Feature Flag:** `flag_gasless_voting`
- **Core Components:** `GaslessVotingToggleDAOSettings` (needs redesign -> becomes PaymasterStatus component), `CastVote` component, `useCastVote` hook, `RefillGasTankModal`.
- **Key Hooks:** `useDepositInfo`, ~~`useKeyValuePairs`~~ (KV logic removed), `useSubmitProposal`.
- **Contracts:** Paymaster (`DecentPaymasterV1` mastercopy deployed via `ZodiacModuleProxyFactory`), `EntryPoint07`, ~~`KeyValuePairs`~~ (KV logic removed), Voting Strategy Validators (`LinearERC20VotingV1ValidatorV1`, `LinearERC721VotingV1ValidatorV1`).
- **State Management:** `useDaoInfoStore` (remove `gaslessVotingEnabled` state, keep `paymasterAddress`).
- **Utils:** `gaslessVoting.ts` (e.g., `getPaymasterAddress`), `prepareRefillPaymasterActionData.ts`.
- **Backend/Infrastructure:** Relies on an ERC-4337 Bundler service (RPC endpoint configured via `rpcEndpoint`).

## 5. Actionable Improvements / Issues Summary

This section lists actionable improvements and issues identified in the desired behaviors described above.

1.  Display clear status: "Sponsorship Status: Inactive (Paymaster not deployed)." No toggle shown. Show "Deploy Paymaster" button only if user has proposal rights.
2.  Implement "Deploy Paymaster" proposal action: Bundle calls for `deployModule`, `addStake` (if required, using 86400s delay & `bundlerMinimumStake`), `setFunctionValidator` (to whitelist strategies), and `depositTo(predictedAddress, initialAmount)` (requiring user input for initial deposit amount >= 0).
3.  Add UI confirmation explaining Paymaster deployment proposal.
4.  Perform Treasury funding check before creating proposals that lock funds (`addStake`) or deposit funds (`depositTo`).
5.  Always display Paymaster Address, Deposit Balance, Locked Funds, and Sponsorship Status (based on validator, stake, lock) in Settings when deployed.
6.  Implement Sponsorship Status display logic (Active, Inactive, Deactivating, Deactivated) based on validator status, locked funds, required funds, and cooldown timer.
7.  Implement "Deactivate Sponsorship" proposal action: Call `removeFunctionValidator(strategy, selector)` for all strategies. If `stake > 0`, also call `unlockStake()`. Add appropriate UI warning.
8.  Implement "Increase Locked Funds" proposal action (`addStake(delta)`) when required and funds are insufficient (validator must already be set).
9.  Support bundling "Withdraw Gas Tank" (`withdrawTo`) with "Deactivate Sponsorship" (`removeFunctionValidator`/`unlockStake`) or "Increase Locked Funds" (`addStake`) in a single proposal.
10. Implement UI for "Deactivating (Validator Removed / Cooldown Period...)" status with warning and correct button states.
11. Implement "Propose Locked Funds Withdrawal" (`withdrawStake`) action with UI explanation about timing (only available after cooldown).
12. Support bundling "Propose Locked Funds Withdrawal" and "Withdraw Gas Tank" in a single proposal during cooldown.
13. Disable actions related to activation/deactivation/increasing lock during cooldown.
14. Implement UI for "Deactivated (Validator Removed / Locked Funds Ready...)" status with warning and correct button states.
15. Implement "Withdraw Locked Funds" (`withdrawStake`) proposal action when ready.
16. Implement "Reactivate Sponsorship" proposal action: Call `setFunctionValidator(strategy, selector, validator)`. If `stake > 0`, calculate delta and call `addStake(86400)` with `msg.value=delta` to top up and re-lock. Add UI explanation.
17. Support bundling "Withdraw Locked Funds" and "Withdraw Gas Tank" into a single proposal when withdrawable.
18. Disable actions related to increasing lock/deactivating sponsorship when already deactivated/withdrawable.
19. Implement UI for "Inactive (Activation Required: Whitelist strategy / Lock funds)" status with warning label.
20. Implement "Activate Sponsorship" proposal action: Call `setFunctionValidator(strategy, selector, validator)`. If `stakingRequired`, also call `addStake(bundlerMinimumStake)`.
21. Confirm Paymaster functionality with 0 locked funds if activation doesn't require locking (`!stakingRequired`). Only `setFunctionValidator` needed in this case.
22. Ensure the "Refill" button is only available when the Paymaster is deployed.
23. Implement the revised proactive logic for determining `canVoteForFree` (8-step check: flag, deployment, validator check, status, activation, estimation, balance).
24. Implement improved gasless vote fallback UX: clear error communication, explicit user prompt for standard tx retry, remove automatic fallback.
25. Implement modal-based UX for sponsored votes: immediate pending modal, update to success/error state (incorporating #24 for error state).
26. Consider adding contextual information explaining _why_ sponsoring is unavailable in the standard voting path.
27. **Allow enabling Gasless Voting during DAO creation:** Implement the workflow where the creator provides `msg.value` to cover the initial stake, which is then forwarded via the predicted DAO address to the Paymaster's `addStake` function within the creation transaction. Requires address prediction, value routing, Paymaster deployment, internal `addStake` call, and strategy whitelisting (`setFunctionValidator`) within the main tx.
