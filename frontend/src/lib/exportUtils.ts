/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Use provided columns or auto-detect from first item
  const cols = columns || Object.keys(data[0]).map((key) => ({
    key: key as keyof T,
    label: key,
  }));

  // Create header row
  const header = cols.map((col) => `"${col.label}"`).join(",");

  // Create data rows
  const rows = data.map((item) =>
    cols
      .map((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) return '""';
        if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === "number") return value.toString();
        if (value instanceof Date) return `"${value.toISOString()}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [header, ...rows].join("\n");

  // Download file
  downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
}

/**
 * Export data to JSON format
 */
export function exportToJSON<T>(data: T[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, "application/json");
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export filename
 */
export function getExportFilename(prefix: string): string {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0];
  return `${prefix}_${dateStr}`;
}

/**
 * Export orders to CSV
 */
export function exportOrders(
  orders: Array<{
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    totalAmount?: number;
    currency?: string;
    status?: string;
    createdAt?: string;
  }>
): void {
  exportToCSV(orders, getExportFilename("orders"), [
    { key: "orderNumber", label: "Buyurtma raqami" },
    { key: "customerName", label: "Mijoz ismi" },
    { key: "customerPhone", label: "Telefon" },
    { key: "customerAddress", label: "Manzil" },
    { key: "totalAmount", label: "Summa" },
    { key: "currency", label: "Valyuta" },
    { key: "status", label: "Holat" },
    { key: "createdAt", label: "Sana" },
  ]);
}

/**
 * Export users to CSV
 */
export function exportUsers(
  users: Array<{
    id?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    role?: string;
    created_at?: string;
  }>
): void {
  exportToCSV(users, getExportFilename("users"), [
    { key: "id", label: "ID" },
    { key: "full_name", label: "Ism" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Telefon" },
    { key: "role", label: "Rol" },
    { key: "created_at", label: "Ro'yxatdan o'tgan sana" },
  ]);
}

/**
 * Export products to CSV
 */
export function exportProducts(
  products: Array<{
    id?: string;
    title?: string;
    category?: string;
    price?: number;
    currency?: string;
    views?: number;
    in_stock?: boolean;
    created_at?: string;
  }>
): void {
  exportToCSV(products, getExportFilename("products"), [
    { key: "id", label: "ID" },
    { key: "title", label: "Nomi" },
    { key: "category", label: "Kategoriya" },
    { key: "price", label: "Narx" },
    { key: "currency", label: "Valyuta" },
    { key: "views", label: "Ko'rishlar" },
    { key: "in_stock", label: "Sotuvda" },
    { key: "created_at", label: "Yaratilgan sana" },
  ]);
}

/**
 * Export analytics data to CSV
 */
export function exportAnalytics(
  data: Array<{
    name?: string;
    value?: number;
    views?: number;
    users?: number;
  }>,
  type: "traffic" | "categories" | "general"
): void {
  const filename = getExportFilename(`analytics_${type}`);
  
  if (type === "traffic") {
    exportToCSV(data, filename, [
      { key: "name", label: "Sana" },
      { key: "views", label: "Ko'rishlar" },
      { key: "users", label: "Foydalanuvchilar" },
    ]);
  } else if (type === "categories") {
    exportToCSV(data, filename, [
      { key: "name", label: "Kategoriya" },
      { key: "value", label: "Soni" },
    ]);
  } else {
    exportToCSV(data, filename);
  }
}
