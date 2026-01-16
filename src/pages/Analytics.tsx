
import React from "react";
import { useData } from "@/contexts/DataContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  PieChart,
  LineChart,
  Timer,
  TrendingUp,
  AlertTriangle,
  Check,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartPieChart,
  Pie,
  Cell,
  LineChart as RechartLineChart,
  Line,
  Legend,
} from "recharts";

const Analytics = () => {
  const { accessLogs, people } = useData();
  
  // Process data for visualization
  
  // Get last 7 days for date labels
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  });
  
  // Daily access count for last 7 days
  const dailyAccessData = last7Days.map((date, index) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - index));
    
    // Filter logs for this day
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    
    const logsForDay = accessLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= dayStart && logDate <= dayEnd;
    });
    
    return {
      name: date,
      total: logsForDay.length,
      granted: logsForDay.filter(log => log.granted).length,
      denied: logsForDay.filter(log => !log.granted).length,
    };
  });
  
  // Access data by user type
  const accessByUserType = [
    { name: 'Students', value: 0 },
    { name: 'Teachers', value: 0 },
    { name: 'Staff', value: 0 },
    { name: 'Admins', value: 0 },
  ];
  
  accessLogs.forEach(log => {
    const typeIndex = accessByUserType.findIndex(
      type => type.name.toLowerCase().startsWith(log.personType)
    );
    if (typeIndex !== -1) {
      accessByUserType[typeIndex].value++;
    }
  });
  
  // Access method distribution
  const accessMethodData = [
    { name: 'Facial Recognition', value: accessLogs.filter(log => log.method === 'facial').length },
    { name: 'Fingerprint', value: accessLogs.filter(log => log.method === 'fingerprint').length },
  ];
  
  // Success rate by hour
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    success: 0,
    failed: 0,
    total: 0,
  }));
  
  accessLogs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hourlyData[hour].total++;
    
    if (log.granted) {
      hourlyData[hour].success++;
    } else {
      hourlyData[hour].failed++;
    }
  });
  
  // Filter out hours with no activity for cleaner chart
  const filteredHourlyData = hourlyData.filter(hour => hour.total > 0);
  
  // Set up colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
  
  // Calculate key metrics
  const totalLogs = accessLogs.length;
  const successRate = Math.round((accessLogs.filter(log => log.granted).length / totalLogs) * 100) || 0;
  const totalUsers = people.length;
  const activeUsers = people.filter(p => p.active).length;
  
  // Access peak time
  const peakHour = [...hourlyData].sort((a, b) => b.total - a.total)[0]?.hour || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Security Analytics</h1>
        <p className="text-muted-foreground">
          Visualize and analyze access patterns and security trends
        </p>
      </div>
      
      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Access Events</p>
                <p className="text-3xl font-bold">{totalLogs}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-md">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Success Rate</p>
                <p className="text-3xl font-bold">{successRate}%</p>
              </div>
              <div className="bg-green-100 p-2 rounded-md">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Peak Access Time</p>
                <p className="text-3xl font-bold">{peakHour}:00</p>
              </div>
              <div className="bg-amber-100 p-2 rounded-md">
                <Timer className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Users</p>
                <p className="text-3xl font-bold">{activeUsers}/{totalUsers}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-md">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Daily Access Activity</CardTitle>
            <CardDescription>
              Entry and exit events over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyAccessData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="granted" 
                    stackId="a" 
                    fill="#10b981" 
                    name="Granted" 
                  />
                  <Bar 
                    dataKey="denied" 
                    stackId="a" 
                    fill="#ef4444" 
                    name="Denied" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Access Method Distribution</CardTitle>
            <CardDescription>
              Percentage of users using each authentication method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPieChart>
                  <Pie
                    data={accessMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {accessMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Access By User Type</CardTitle>
            <CardDescription>
              Distribution of access events by user role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPieChart>
                  <Pie
                    data={accessByUserType.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {accessByUserType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Hourly Success Rate</CardTitle>
            <CardDescription>
              Access success and failure patterns throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartLineChart
                  data={filteredHourlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => `${hour}:00`}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, name === "success" ? "Successful" : "Failed"]}
                    labelFormatter={(hour) => `${hour}:00 - ${hour+1}:00`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="success" 
                    stroke="#10b981" 
                    activeDot={{ r: 8 }} 
                    name="Successful"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="#ef4444" 
                    name="Failed"
                  />
                </RechartLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
