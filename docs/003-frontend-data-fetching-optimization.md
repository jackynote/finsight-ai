# Technical Solution 003: Frontend Data Fetching Optimization

## 1. Problem Statement
Currently, `App.tsx` fetches all financial data (`transactions`, `assets`, `currencies`, `aiInsights`) in a single `useEffect` hook on mount. This leads to:
- **Redundant API calls**: Fetching transactions even when the user is only viewing the `/assets` page.
- **Bloated App.tsx**: The root component manages too much state and business logic.
- **Performance impact**: Unnecessary network overhead and potential "waterfall" fetching for large datasets.

## 2. Objectives
- **On-demand fetching**: Each route should only fetch the data it strictly needs.
- **State Management**: Use React Context to share data that is truly global (e.g., User, Totals for Sidebar).
- **Clean Architecture**: Move page-specific logic from `App.tsx` into dedicated view components.

## 3. Proposed Architecture

### A. Finance Context (`FinanceContext.tsx`)
Create a context to hold shared data that affects multiple parts of the UI (like the Sidebar totals).
- **State**: `totals`, `currencies`, `isLoadingGlobal`.
- **Actions**: `refreshTotals()`, `refreshCurrencies()`.

### B. Page-based Routing (`src/pages/`)
Move fetching logic into dedicated page components managed by React Router:
1. **DashboardPage**: Fetches `transactions` (recent), `assets`, and `insights`.
2. **TransactionsPage**: Fetches the full `transactions` list.
3. **AssetsPage**: Fetches `assets` and `currencies`.
4. **AssistantPage**: Manages the AI chat interface, socket connection, and chat history.

### C. Directory Structure
```text
src/
 ├── contexts/
 │    └── FinanceContext.tsx
 ├── pages/
 │    ├── Dashboard.tsx
 │    ├── Transactions.tsx
 │    ├── Assets.tsx
 │    └── Assistant.tsx
 ├── App.tsx
 └── main.tsx
```

### D. Improved `App.tsx`
- Remove massive `useEffect` for data fetching.
- Act as a Router and Layout provider only.
- Wrap the app in `FinanceProvider`.

## 4. Implementation Steps

1. **Create FinanceContext**:
   - Implement `FinanceProvider` in `src/contexts/FinanceContext.tsx`.
   - Calculate `totals` within the provider or via a utility function.

2. **Decouple into Pages**:
   - Extract the inline transaction table from `App.tsx` into `src/pages/Transactions.tsx`.
   - Extract the asset grid from `App.tsx` into `src/pages/Assets.tsx`.
   - Move `AssistantView` logic and socket management into `src/pages/Assistant.tsx`.
   - Create `src/pages/Dashboard.tsx` to handle the main overview.

3. **Update Route Logic**:
   - Update `App.tsx` to render these new components.
   - Each component will use `useEffect` to fetch its own data via `financeService`.

4. **Shared Totals Update**:
   - When an asset or transaction is added/updated in a sub-page, trigger a refresh of the `totals` in `FinanceContext` to keep the Sidebar updated.

## 5. Benefits
- **Efficiency**: Only relevant data is loaded per route.
- **Maintainability**: Smaller, focused components.
- **Scalability**: Easier to add new features without overloading the main entry point.
