import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Database, 
  Shield,
  Loader2,
  TrendingUp,
  MapPin,
  Fuel
} from "lucide-react";

interface Report {
  id: string;
  station_id: string;
  anonymous_user_id: string;
  fuel_type: string;
  user_lat: number;
  user_lon: number;
  timestamp: string;
  trust_score_at_submission: number | null;
  time_decay_factor: number | null;
  location_factor: number | null;
  dve_score: number | null;
  is_verified: boolean;
  is_rejected: boolean;
  rejection_reason: string | null;
  fuel_stations: { name: string } | null;
}

interface TrustScore {
  id: string;
  anonymous_user_id: string;
  trust_score: number;
  total_reports: number;
  correct_reports: number;
  incorrect_reports: number;
}

interface VerifiedData {
  id: string;
  station_id: string;
  fuel_type: string;
  confidence_score: number;
  verified_by_count: number;
  last_verified_at: string;
  fuel_stations: { name: string } | null;
}

interface DVEConfig {
  INITIAL_TRUST_SCORE: number;
  TRUST_INCREMENT: number;
  TRUST_DECREMENT: number;
  MIN_TRUST_SCORE: number;
  MAX_TRUST_SCORE: number;
  TIME_DECAY_HALF_LIFE: number;
  MAX_REPORT_AGE_HOURS: number;
  MAX_DISTANCE_KM: number;
  OPTIMAL_DISTANCE_KM: number;
  MIN_REPORTS_FOR_CONSENSUS: number;
  CONSENSUS_THRESHOLD: number;
  CONSENSUS_BONUS: number;
  VERIFICATION_THRESHOLD: number;
}

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [trustScores, setTrustScores] = useState<TrustScore[]>([]);
  const [verifiedData, setVerifiedData] = useState<VerifiedData[]>([]);
  const [config, setConfig] = useState<DVEConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const { toast } = useToast();
  
  // Debounce ref to prevent rapid refetches
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await supabase.functions.invoke("dve-process", {
        body: { action: "get_admin_data" },
      });

      if (response.data) {
        setReports(response.data.reports || []);
        setTrustScores(response.data.trustScores || []);
        setVerifiedData(response.data.verifiedData || []);
        setConfig(response.data.config || null);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Debounced fetch for real-time updates
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchData();
    }, 500);
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions with debounced refresh
    const reportsChannel = supabase
      .channel('admin-reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crowdsourced_reports'
        },
        (payload) => {
          console.log('Report change detected:', payload);
          debouncedFetch();
          toast({
            title: "Data Updated",
            description: `Report ${payload.eventType === 'INSERT' ? 'added' : 'updated'}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'verified_fuel_data'
        },
        (payload) => {
          console.log('Verified data change detected:', payload);
          debouncedFetch();
          toast({
            title: "Verified Data Updated",
            description: "Fuel verification status changed",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_trust_scores'
        },
        (payload) => {
          console.log('Trust score change detected:', payload);
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(reportsChannel);
    };
  }, [fetchData, debouncedFetch, toast]);

  const reprocessPending = useCallback(async () => {
    setReprocessing(true);
    try {
      const response = await supabase.functions.invoke("dve-process", {
        body: { action: "reprocess_pending" },
      });

      if (response.data?.success) {
        console.log(`Reprocessed and verified ${response.data.verifiedCount} reports`);
        toast({
          title: "Reprocessing Complete",
          description: `Verified ${response.data.verifiedCount} reports`,
        });
        await fetchData();
      }
    } catch (error) {
      console.error("Error reprocessing pending reports:", error);
      toast({
        title: "Reprocessing Failed",
        description: "Failed to reprocess pending reports",
        variant: "destructive",
      });
    } finally {
      setReprocessing(false);
    }
  }, [fetchData, toast]);

  // Memoized filtered reports for performance
  const verifiedReports = useMemo(() => reports.filter((r) => r.is_verified), [reports]);
  const rejectedReports = useMemo(() => reports.filter((r) => r.is_rejected), [reports]);
  const pendingReports = useMemo(() => reports.filter((r) => !r.is_verified && !r.is_rejected), [reports]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-mono text-muted-foreground">Loading DVE Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Map
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">FuelSync DVE Admin</h1>
                <p className="text-xs text-muted-foreground">Data Verification Engine Monitor</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={reprocessPending} 
              disabled={reprocessing || pendingReports.length === 0} 
              variant="default" 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className={`w-4 h-4 mr-2 ${reprocessing ? "animate-pulse" : ""}`} />
              {reprocessing ? "Processing..." : `Verify Pending (${pendingReports.length})`}
            </Button>
            <Button onClick={fetchData} disabled={refreshing} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-3xl font-bold">{reports.length}</p>
                </div>
                <Database className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-3xl font-bold text-green-500">{verifiedReports.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-3xl font-bold text-red-500">{rejectedReports.length}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-3xl font-bold">{trustScores.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DVE Configuration */}
        {config && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                DVE Configuration Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Initial Trust</p>
                  <p className="font-mono font-bold">{config.INITIAL_TRUST_SCORE}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Time Decay (hrs)</p>
                  <p className="font-mono font-bold">{config.TIME_DECAY_HALF_LIFE}h</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Max Distance</p>
                  <p className="font-mono font-bold">{config.MAX_DISTANCE_KM}km</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Verification Threshold</p>
                  <p className="font-mono font-bold">{(config.VERIFICATION_THRESHOLD * 100).toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all-reports">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all-reports">All Reports</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="verified">Verified Fuel</TabsTrigger>
            <TabsTrigger value="trust-scores">User Trust</TabsTrigger>
          </TabsList>

          {/* All Reports Tab */}
          <TabsContent value="all-reports">
            <Card>
              <CardHeader>
                <CardTitle>All Crowdsourced Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Station</TableHead>
                        <TableHead>Fuel</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Trust</TableHead>
                        <TableHead>Time Decay</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>DVE Score</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium max-w-32 truncate">
                            {report.fuel_stations?.name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.fuel_type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {report.anonymous_user_id}
                          </TableCell>
                          <TableCell>
                            {report.trust_score_at_submission?.toFixed(2) || "-"}
                          </TableCell>
                          <TableCell>
                            {report.time_decay_factor?.toFixed(2) || "-"}
                          </TableCell>
                          <TableCell>
                            {report.location_factor?.toFixed(2) || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                (report.dve_score || 0) >= 0.4
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {((report.dve_score || 0) * 100).toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {report.is_verified ? (
                              <Badge className="bg-green-500">Verified</Badge>
                            ) : report.is_rejected ? (
                              <Badge variant="destructive">Rejected</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {reports.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No reports yet. Submit fuel availability reports from the map.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rejected Reports Tab */}
          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Rejected Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Station</TableHead>
                        <TableHead>Fuel</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Rejection Reason</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>{report.fuel_stations?.name || "Unknown"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.fuel_type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {report.anonymous_user_id}
                          </TableCell>
                          <TableCell className="text-red-500">
                            {report.rejection_reason}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(report.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {rejectedReports.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No rejected reports
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verified Fuel Tab */}
          <TabsContent value="verified">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Verified Fuel Data (Displayed on Map)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Station</TableHead>
                        <TableHead>Fuel Type</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Verified By</TableHead>
                        <TableHead>Last Verified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifiedData.map((data) => (
                        <TableRow key={data.id}>
                          <TableCell className="font-medium">
                            {data.fuel_stations?.name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Badge>{data.fuel_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500">
                              {(data.confidence_score * 100).toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {data.verified_by_count} users
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(data.last_verified_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {verifiedData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No verified fuel data yet. Reports need consensus from multiple users.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trust Scores Tab */}
          <TabsContent value="trust-scores">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Trust Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Trust Score</TableHead>
                        <TableHead>Total Reports</TableHead>
                        <TableHead>Correct</TableHead>
                        <TableHead>Incorrect</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trustScores.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono">{user.anonymous_user_id}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.trust_score >= 0.7
                                  ? "default"
                                  : user.trust_score >= 0.4
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {(user.trust_score * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell>{user.total_reports}</TableCell>
                          <TableCell className="text-green-500">{user.correct_reports}</TableCell>
                          <TableCell className="text-red-500">{user.incorrect_reports}</TableCell>
                        </TableRow>
                      ))}
                      {trustScores.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No users have submitted reports yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}