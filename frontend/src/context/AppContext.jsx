import { createContext, useContext, useReducer, useCallback, useMemo } from "react";
import api from "../api/axios";


const productsReducer = (state, action) => {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "SET_PRODUCTS":
      return { ...state, products: action.payload, loading: false };
    case "PATCH_PRODUCT":
      // Used for the quick-add tap: patch just the one tile's counters
      // in place instead of refetching the whole product list.
      return {
        ...state,
        products: state.products.map((p) =>
          p._id === action.payload.id
            ? { ...p, dailyCount: action.payload.dailyCount, dailyRevenue: action.payload.dailyRevenue }
            : p
        ),
      };
    case "ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const ProductsStateContext = createContext(null);
const ProductsActionsContext = createContext(null);

const ProductsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(productsReducer, {
    products: [],
    loading: false,
    error: null,
  });

  const fetchProducts = useCallback(async (category) => {
    dispatch({ type: "LOADING" });
    try {
      const res = await api.get("/products", { params: category ? { category } : {} });
      dispatch({ type: "SET_PRODUCTS", payload: res.data });
    } catch (err) {
      dispatch({ type: "ERROR", payload: err.message });
    }
  }, []);

  // Optimistic quick-add: patch local state immediately (so the tap feels
  // instant), then reconcile with the server response. On failure, roll
  // back by refetching.
  const sellProduct = useCallback(async (productId, quantity = 1) => {
    const optimisticProduct = { id: productId };
    try {
      const res = await api.post(`/products/${productId}/sell`, { quantity });
      dispatch({ type: "PATCH_PRODUCT", payload: res.data });
      return res.data;
    } catch (err) {
      dispatch({ type: "ERROR", payload: err.message });
      throw err;
    }
  }, []);

  // Actions object identity is stable across renders (all deps are []),
  // so consumers of ProductsActionsContext never re-render from this provider.
  const actions = useMemo(() => ({ fetchProducts, sellProduct }), [fetchProducts, sellProduct]);

  return (
    <ProductsStateContext.Provider value={state}>
      <ProductsActionsContext.Provider value={actions}>
        {children}
      </ProductsActionsContext.Provider>
    </ProductsStateContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductsStateContext);
  if (!ctx) throw new Error("useProducts must be used within AppProvider");
  return ctx;
};
export const useProductActions = () => {
  const ctx = useContext(ProductsActionsContext);
  if (!ctx) throw new Error("useProductActions must be used within AppProvider");
  return ctx;
};

// ---------------------------------------------------------------------------
// Customers domain
// ---------------------------------------------------------------------------
const customersReducer = (state, action) => {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "SET_CUSTOMERS":
      return { ...state, customers: action.payload, loading: false };
    case "UPSERT_CUSTOMER":
      return {
        ...state,
        customers: state.customers.some((c) => c._id === action.payload._id)
          ? state.customers.map((c) => (c._id === action.payload._id ? action.payload : c))
          : [action.payload, ...state.customers],
      };
    case "REMOVE_CUSTOMER":
      return { ...state, customers: state.customers.filter((c) => c._id !== action.payload) };
    case "ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const CustomersStateContext = createContext(null);
const CustomersActionsContext = createContext(null);

const CustomersProvider = ({ children }) => {
  const [state, dispatch] = useReducer(customersReducer, {
    customers: [],
    loading: false,
    error: null,
  });

  const fetchCustomers = useCallback(async (type) => {
    dispatch({ type: "LOADING" });
    try {
      const res = await api.get("/customers", { params: type ? { type } : {} });
      dispatch({ type: "SET_CUSTOMERS", payload: res.data });
    } catch (err) {
      dispatch({ type: "ERROR", payload: err.message });
    }
  }, []);

  const createCustomer = useCallback(async (payload) => {
    const res = await api.post("/customers", payload);
    dispatch({ type: "UPSERT_CUSTOMER", payload: res.data });
    return res.data;
  }, []);

  const deleteCustomer = useCallback(async (id) => {
    await api.delete(`/customers/${id}`);
    dispatch({ type: "REMOVE_CUSTOMER", payload: id });
  }, []);

  const addTransaction = useCallback(async (payload) => {
    // payload: { customer, type, amount, note }
    const res = await api.post("/transactions", payload);
    return res.data;
  }, []);

  const actions = useMemo(
    () => ({ fetchCustomers, createCustomer, deleteCustomer, addTransaction }),
    [fetchCustomers, createCustomer, deleteCustomer, addTransaction]
  );

  return (
    <CustomersStateContext.Provider value={state}>
      <CustomersActionsContext.Provider value={actions}>
        {children}
      </CustomersActionsContext.Provider>
    </CustomersStateContext.Provider>
  );
};

export const useCustomers = () => {
  const ctx = useContext(CustomersStateContext);
  if (!ctx) throw new Error("useCustomers must be used within AppProvider");
  return ctx;
};
export const useCustomerActions = () => {
  const ctx = useContext(CustomersActionsContext);
  if (!ctx) throw new Error("useCustomerActions must be used within AppProvider");
  return ctx;
};

// ---------------------------------------------------------------------------
// Dashboard domain (read-mostly, so a single lightweight context is fine)
// ---------------------------------------------------------------------------
const DashboardContext = createContext(null);

const DashboardProvider = ({ children }) => {
  const [state, setState] = useReducer(
    (s, patch) => ({ ...s, ...patch }),
    { summary: null, loading: false, error: null }
  );

  const fetchDashboard = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const res = await api.get("/reports/dashboard");
      setState({ summary: res.data, loading: false });
    } catch (err) {
      setState({ loading: false, error: err.message });
    }
  }, []);

  const value = useMemo(() => ({ ...state, fetchDashboard }), [state, fetchDashboard]);

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within AppProvider");
  return ctx;
};

// ---------------------------------------------------------------------------
// Root provider — compose all domains once at the app root
// ---------------------------------------------------------------------------
export const AppProvider = ({ children }) => (
  <ProductsProvider>
    <CustomersProvider>
      <DashboardProvider>{children}</DashboardProvider>
    </CustomersProvider>
  </ProductsProvider>
);
