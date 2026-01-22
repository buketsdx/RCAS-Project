// RCAS Data Bridge Client
export const base44 = {
  auth: {
    me: async () => ({
      id: "1",
      full_name: "Rustam Ali",
      role: "Admin"
    }),
    logout: () => {
      console.log("Logging out...");
      window.location.reload();
    }
  },
  entities: {
    // Ye hissa aapke Reports aur Tables ke liye data layega
    AccountGroup: { list: async () => [] },
    Ledger: { list: async () => [] },
    Voucher: { list: async () => [] },
    StockItem: { list: async () => [] },
    Company: { list: async () => [{ id: "1", name: "Buket Flower Shop" }] }
  }
};