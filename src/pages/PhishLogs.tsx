import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { Download, Trash2, AlertCircle, Shield, Users, History, Globe, Smartphone, Monitor } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SecurityLog {
    id: number;
    attempt_type: string;
    status: string;
    email: string;
    ip_address: string;
    failure_reason: string;
    created_at: string;
    user_agent: string;
    input_details: string;
    country?: string;
    city?: string;
    isp?: string;
}

interface VisitorLog {
    id: number;
    page_visited: string;
    ip_address: string;
    platform: string;
    referrer: string;
    created_at: string;
    network_info: string;
    screen_resolution: string;
    user_agent: string;
    country?: string;
    city?: string;
    isp?: string;
}

const PhishLogs = () => {
    const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
    const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Cleanup State
    const [showCleanupDialog, setShowCleanupDialog] = useState(false);
    const [confirmationStep, setConfirmationStep] = useState(0);
    const [cleanupType, setCleanupType] = useState<'security' | 'visitor' | null>(null);

    // Details State
    const [selectedLog, setSelectedLog] = useState<SecurityLog | VisitorLog | null>(null);
    const [detailType, setDetailType] = useState<'security' | 'visitor' | null>(null);

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [secretInput, setSecretInput] = useState("");

    useEffect(() => {
        const checkAuth = () => {
            const expiry = localStorage.getItem("phishlogs_auth_expiry");
            if (expiry) {
                if (Date.now() < parseInt(expiry)) {
                    setIsAuthenticated(true);
                    fetchLogs();
                } else {
                    localStorage.removeItem("phishlogs_auth_expiry");
                }
            }
        };
        checkAuth();
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (secretInput === "gm@1337") {
            setIsAuthenticated(true);
            // Set 5 minute expiry (5 * 60 * 1000 ms)
            localStorage.setItem("phishlogs_auth_expiry", (Date.now() + 300000).toString());
            toast.success("Access Granted");
            fetchLogs(); // Fetch after auth
        } else {
            toast.error("Invalid Secret Key");
        }
    };

    const fetchLogs = async () => {
        try {
            const [secLogs, visLogs] = await Promise.all([
                api.logs.getSecurityLogs(),
                api.logs.getVisitorLogs(),
            ]);
            setSecurityLogs(secLogs);
            setVisitorLogs(visLogs);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
            toast.error("Failed to refresh logs");
        } finally {
            setLoading(false);
        }
    };

    // Analytics Helpers
    const processChartData = (logs: any[], dateKey: string) => {
        const grouped = logs.reduce((acc: any, log: any) => {
            const date = new Date(log[dateKey]).toLocaleDateString();
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        return Object.keys(grouped).map(date => ({
            date,
            count: grouped[date]
        })).slice(-7); // Last 7 days
    };

    const processPieData = (logs: any[], key: string) => {
        const grouped = logs.reduce((acc: any, log: any) => {
            const value = log[key] || "Unknown";
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});

        return Object.keys(grouped).map(name => ({
            name,
            value: grouped[name]
        })).sort((a, b) => b.value - a.value).slice(0, 5);
    };

    const securityChartData = useMemo(() => processChartData(securityLogs, 'timestamp'), [securityLogs]);
    const visitorChartData = useMemo(() => processChartData(visitorLogs, 'visited_at'), [visitorLogs]);

    // New Analytics Data
    const deviceData = useMemo(() => processPieData(visitorLogs, 'platform'), [visitorLogs]);
    const countryData = useMemo(() => processPieData(visitorLogs, 'country'), [visitorLogs]);
    const browserData = useMemo(() => {
        // Simple User Agent Parsing for demonstration
        const getBrowser = (ua: string) => {
            if (ua.includes('Chrome')) return 'Chrome';
            if (ua.includes('Firefox')) return 'Firefox';
            if (ua.includes('Safari')) return 'Safari';
            if (ua.includes('Edge')) return 'Edge';
            return 'Other';
        };
        const grouped = visitorLogs.reduce((acc: any, log) => {
            const browser = getBrowser(log.user_agent || '');
            acc[browser] = (acc[browser] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(grouped).map(name => ({
            name,
            value: grouped[name]
        }));
    }, [visitorLogs]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // CSV Export Helper
    const downloadCSV = (data: any[], filename: string) => {
        if (!data.length) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header] ? row[header].toString().replace(/,/g, ' ') : '';
                return value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const initiateCleanup = (type: 'security' | 'visitor') => {
        setCleanupType(type);
        setConfirmationStep(1);
        setShowCleanupDialog(true);
    };

    const handleConfirm = async () => {
        if (confirmationStep === 1) {
            setConfirmationStep(2);
        } else if (confirmationStep === 2) {
            try {
                if (cleanupType === 'security') {
                    await api.logs.deleteSecurityLogs();
                    toast.success("Security logs cleared");
                } else if (cleanupType === 'visitor') {
                    await api.logs.deleteVisitorLogs();
                    toast.success("Visitor logs cleared");
                }
                fetchLogs();
                setShowCleanupDialog(false);
                setConfirmationStep(0);
                setCleanupType(null);
            } catch (error) {
                console.error(error);
                toast.error("Failed to delete logs");
            }
        }
    };

    const handleCancel = () => {
        setShowCleanupDialog(false);
        setConfirmationStep(0);
        setCleanupType(null);
    };

    const openDetails = (log: SecurityLog | VisitorLog, type: 'security' | 'visitor') => {
        setSelectedLog(log);
        setDetailType(type);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center text-xl flex flex-col items-center gap-2">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <AlertCircle className="w-8 h-8 text-primary" />
                            </div>
                            System Access Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="secret" className="text-sm font-medium">Enter Administrator Secret Key</label>
                                <input
                                    id="secret"
                                    type="password"
                                    value={secretInput}
                                    onChange={(e) => setSecretInput(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="••••••••"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Verify Access
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center">Loading logs...</div>;
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <h1 className="text-3xl font-bold mb-6">System Logs</h1>

            {/* Security Logs Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Security Audit Logs
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadCSV(securityLogs, 'security_logs.csv')}
                            disabled={securityLogs.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => initiateCleanup('security')}
                            className="flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Cleanup Logs
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {securityChartData.length > 0 && (
                        <div className="h-[200px] w-full mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={securityChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" fontSize={12} />
                                    <YAxis allowDecimals={false} fontSize={12} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#3b82f6" name="Events" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Input Details</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>User Agent</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {securityLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center">
                                            No security logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    securityLogs.map((log) => (
                                        <TableRow
                                            key={log.id}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => openDetails(log, 'security')}
                                        >
                                            <TableCell>{log.id}</TableCell>
                                            <TableCell className="capitalize">{log.attempt_type}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${log.status === "success"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {log.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>{log.email || "-"}</TableCell>
                                            <TableCell className="max-w-[350px] whitespace-normal break-all font-mono text-sm py-3" title={log.input_details}>
                                                {log.input_details || "-"}
                                            </TableCell>
                                            <TableCell>{log.ip_address}</TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={log.user_agent}>
                                                {log.user_agent || "-"}
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={log.failure_reason}>
                                                {log.failure_reason || "-"}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Visitor Logs Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Visitor Traffic Logs
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadCSV(visitorLogs, 'visitor_logs.csv')}
                            disabled={visitorLogs.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => initiateCleanup('visitor')}
                            className="flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Cleanup Logs
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {visitorChartData.length > 0 && (
                        <div className="h-[200px] w-full mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={visitorChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" fontSize={12} />
                                    <YAxis allowDecimals={false} fontSize={12} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#10b981" name="Visits" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Page</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>User Agent</TableHead>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Referrer</TableHead>
                                    <TableHead>Resolution</TableHead>
                                    <TableHead>Network</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visitorLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center">
                                            No visitor logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    visitorLogs.map((log) => (
                                        <TableRow
                                            key={log.id}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => openDetails(log, 'visitor')}
                                        >
                                            <TableCell>{log.id}</TableCell>
                                            <TableCell>{log.page_visited}</TableCell>
                                            <TableCell>{log.ip_address}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={log.user_agent}>
                                                {log.user_agent || "-"}
                                            </TableCell>
                                            <TableCell>{log.platform || "-"}</TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={log.referrer}>
                                                {log.referrer || "-"}
                                            </TableCell>
                                            <TableCell>{log.screen_resolution || "-"}</TableCell>
                                            <TableCell>{log.network_info || "-"}</TableCell>
                                            <TableCell className="whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Cleanup Dialog */}
            <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmationStep === 1 ? "Are you sure?" : "Final Confirmation"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmationStep === 1
                                ? `This will permanently delete all ${cleanupType === 'security' ? 'security audit' : 'visitor traffic'} logs.`
                                : "WARNING: This action cannot be undone. Are you absolutely sure providing this data is no longer needed?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirm();
                            }}
                            className={confirmationStep === 2 ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                            {confirmationStep === 1 ? "Continue" : "Permanently Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Log Details Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Log Details (#{selectedLog?.id})</DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                            {selectedLog && detailType === 'security' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Type</h4>
                                            <p className="capitalize font-medium text-foreground">{(selectedLog as SecurityLog).attempt_type}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                                            <p className={(selectedLog as SecurityLog).status === 'success' ? 'text-green-600' : 'text-red-600'}>
                                                {(selectedLog as SecurityLog).status}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">Email</h4>
                                        <p className="font-medium text-foreground">{(selectedLog as SecurityLog).email}</p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">Failure Reason</h4>
                                        <p className="font-medium text-foreground">{(selectedLog as SecurityLog).failure_reason || "N/A"}</p>
                                    </div>

                                    <div className="bg-muted p-4 rounded-md">
                                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Full Input Details</h4>
                                        <pre className="text-sm whitespace-pre-wrap break-all font-mono leading-relaxed text-red-500">
                                            {(selectedLog as SecurityLog).input_details || "No input captured"}
                                        </pre>
                                    </div>
                                </>
                            )}

                            {selectedLog && detailType === 'visitor' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Page Visited</h4>
                                            <p className="font-medium text-foreground">{(selectedLog as VisitorLog).page_visited}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Platform</h4>
                                            <p className="font-medium text-foreground">{(selectedLog as VisitorLog).platform || "N/A"}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Resolution</h4>
                                            <p className="font-medium text-foreground">{(selectedLog as VisitorLog).screen_resolution || "N/A"}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Network</h4>
                                            <p className="font-medium text-foreground">{(selectedLog as VisitorLog).network_info || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">Referrer</h4>
                                        <p className="break-all font-medium text-foreground">{(selectedLog as VisitorLog).referrer || "Direct"}</p>
                                    </div>
                                </>
                            )}

                            {/* Common Fields */}
                            {selectedLog && (
                                <>
                                    <div className="border-t pt-4 mt-4">
                                        <h4 className="font-semibold text-sm text-muted-foreground">IP Address</h4>
                                        <p className="font-mono font-medium text-foreground">{selectedLog.ip_address}</p>
                                    </div>

                                    {(selectedLog as any).country && (
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div>
                                                <h4 className="font-semibold text-sm text-muted-foreground">Location</h4>
                                                <p className="font-medium text-foreground">
                                                    {(selectedLog as any).city ? `${(selectedLog as any).city}, ` : ''}{(selectedLog as any).country}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-muted-foreground">ISP</h4>
                                                <p className="font-medium text-foreground">{(selectedLog as any).isp || 'N/A'}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-2">
                                        <h4 className="font-semibold text-sm text-muted-foreground">Timestamp</h4>
                                        <p className="font-medium text-foreground">{new Date(selectedLog.created_at).toLocaleString()}</p>
                                    </div>

                                    <div className="bg-muted p-3 rounded-md">
                                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Full User Agent</h4>
                                        <p className="text-xs break-all font-mono text-red-500">
                                            {selectedLog.user_agent || "N/A"}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PhishLogs;
