import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Download, Trash2, Users, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useListTables, useCreateTable, useDeleteTable, getListTablesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function TableQRCard({ table }: { table: { id: number; tableNumber: number; name?: string | null; capacity: number; isActive: boolean; qrCode: string } }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}${table.qrCode}`;
    QRCode.toDataURL(url, { width: 200, margin: 2, color: { dark: "#1a1a1a", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [table.qrCode]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `table-${table.tableNumber}-qr.png`;
    a.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Table {table.tableNumber}</h3>
          {table.name && <p className="text-xs text-gray-400">{table.name}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${table.isActive ? "bg-green-500" : "bg-gray-300"}`} />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users size={12} /> {table.capacity}
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col items-center">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR Code Table ${table.tableNumber}`} className="w-36 h-36 rounded-xl" data-testid={`qr-${table.id}`} />
        ) : (
          <div className="w-36 h-36 bg-gray-100 rounded-xl flex items-center justify-center">
            <QrCode size={40} className="text-gray-300" />
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2 font-mono">/menu?table={table.tableNumber}</p>
        <button
          onClick={handleDownload}
          disabled={!qrDataUrl}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-red-50 px-3 py-2 rounded-full transition-colors disabled:opacity-40"
          data-testid={`download-qr-${table.id}`}
        >
          <Download size={13} /> Download QR
        </button>
      </div>
    </div>
  );
}

export default function AdminTables() {
  const [showForm, setShowForm] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState("4");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tables = [], isLoading } = useListTables();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) return;
    try {
      await createTable.mutateAsync({
        data: { tableNumber: Number(tableNumber), name: tableName || undefined, capacity: Number(capacity) }
      });
      queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() });
      setTableNumber(""); setTableName(""); setCapacity("4"); setShowForm(false);
      toast({ title: `Table ${tableNumber} created` });
    } catch {
      toast({ title: "Failed to create table", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number, num: number) => {
    if (!confirm(`Delete Table ${num}?`)) return;
    try {
      await deleteTable.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() });
      toast({ title: `Table ${num} deleted` });
    } catch {
      toast({ title: "Failed to delete table", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tables & QR Codes</h1>
            <p className="text-sm text-gray-500 mt-1">Manage tables and generate QR codes for customers</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            data-testid="add-table-btn"
          >
            <Plus size={16} /> Add Table
          </button>
        </div>

        {/* Add Table Form */}
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreate}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6"
          >
            <h2 className="font-semibold text-gray-900 mb-4">New Table</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Table Number *</label>
                <input
                  type="number" min={1} value={tableNumber} onChange={e => setTableNumber(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  data-testid="table-number-input"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                <input
                  type="text" value={tableName} onChange={e => setTableName(e.target.value)} placeholder="e.g. Window Table"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Capacity</label>
                <input
                  type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createTable.isPending} className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60" data-testid="create-table-submit">
                Create Table
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {/* Tables Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <QrCode size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No tables yet</p>
            <p className="text-sm text-gray-400">Add your first table to generate a QR code</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table, i) => (
              <motion.div key={table.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="relative group">
                <TableQRCard table={table} />
                <button
                  onClick={() => handleDelete(table.id, table.tableNumber)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                  data-testid={`delete-table-${table.id}`}
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
