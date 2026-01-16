
import React, { useState } from "react";
import { useData, AccessLog } from "@/contexts/DataContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Search,
  SlidersHorizontal,
  FileDown,
  Filter,
  Check,
  X,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const AccessLogs = () => {
  const { accessLogs } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [accessTypeFilter, setAccessTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Filter the logs
  const filteredLogs = accessLogs.filter(log => {
    const matchesSearch = searchQuery === "" || 
      log.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAccessType = accessTypeFilter === "all" || log.accessType === accessTypeFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "granted" && log.granted) || 
      (statusFilter === "denied" && !log.granted);
    const matchesMethod = methodFilter === "all" || log.method === methodFilter;
    
    return matchesSearch && matchesAccessType && matchesStatus && matchesMethod;
  });
  
  // Sort the logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
  });
  
  // Export logs as CSV (mock function)
  const exportLogs = () => {
    alert("In a real system, this would generate a CSV file of the filtered logs.");
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Access Logs</h1>
        <p className="text-muted-foreground">
          View and analyze all access attempts in the system
        </p>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <History className="mr-2 h-5 w-5" />
              Access Log History
            </div>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardTitle>
          <CardDescription>
            Review all entry and exit records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Filter Access Logs</h4>
                      <p className="text-sm text-muted-foreground">
                        Narrow down logs by specific criteria
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid gap-1">
                        <label htmlFor="accessType" className="text-sm">
                          Access Type
                        </label>
                        <Select value={accessTypeFilter} onValueChange={setAccessTypeFilter}>
                          <SelectTrigger id="accessType">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="entry">Entry Only</SelectItem>
                            <SelectItem value="exit">Exit Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-1">
                        <label htmlFor="status" className="text-sm">
                          Access Status
                        </label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger id="status">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="granted">Granted Only</SelectItem>
                            <SelectItem value="denied">Denied Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-1">
                        <label htmlFor="method" className="text-sm">
                          Auth Method
                        </label>
                        <Select value={methodFilter} onValueChange={setMethodFilter}>
                          <SelectTrigger id="method">
                            <SelectValue placeholder="All Methods" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Methods</SelectItem>
                            <SelectItem value="facial">Facial Only</SelectItem>
                            <SelectItem value="fingerprint">Fingerprint Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setAccessTypeFilter("all");
                        setStatusFilter("all");
                        setMethodFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button
                variant="outline"
                onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                className="h-10"
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortDirection === "asc" ? "Oldest First" : "Newest First"}
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead className="hidden md:table-cell">Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No logs found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-mono text-xs">
                          {format(new Date(log.timestamp), "yyyy-MM-dd")}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), "HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{log.personName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${log.personType === 'student' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                              log.personType === 'teacher' ? 'bg-green-50 text-green-700 border-green-200' : 
                              log.personType === 'staff' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                              'bg-purple-50 text-purple-700 border-purple-200'}
                          `}
                        >
                          {log.personType}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {log.location}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.accessType === "entry" ? "default" : "outline"}>
                          {log.accessType === "entry" ? "Entry" : "Exit"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="capitalize">
                          {log.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.granted ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            <Check className="h-3 w-3 mr-1" /> Granted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                            <X className="h-3 w-3 mr-1" /> Denied
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessLogs;
