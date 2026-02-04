import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PlayCircle, 
  CreditCard, 
  Banknote,
  MoreHorizontal,
  RefreshCw,
  User,
  Scissors
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function BookingManagement() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const [activeTab, setActiveTab] = useState("queue");

  // Fetch Stylists for mapping
  const { data: stylists = [] } = useQuery({
    queryKey: ['stylists', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Employee.list();
      return list.filter(e => String(e.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  // Fetch Bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Booking.list();
      return list
        .filter(b => String(b.company_id) === String(selectedCompanyId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    enabled: !!selectedCompanyId,
    refetchInterval: 10000 // Refresh every 10s
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => rcas.entities.Booking.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success("Booking status updated");
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, payment_status }) => rcas.entities.Booking.update(id, { payment_status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success("Payment status updated");
    }
  });

  const handleStatusChange = (id, status) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handlePaymentChange = (id, status) => {
    updatePaymentMutation.mutate({ id, payment_status: status });
  };

  // Filter Data
  const queueData = bookings.filter(b => b.status === 'Waiting');
  const inServiceData = bookings.filter(b => b.status === 'In Service');
  const historyData = bookings.filter(b => ['Completed', 'Cancelled'].includes(b.status));

  const getStylistName = (id) => {
    const s = stylists.find(st => String(st.id) === String(id));
    return s ? s.name : 'Any Available';
  };

  const columns = [
    {
      header: 'Ticket',
      accessorKey: 'ticket_number',
      cell: (info) => <span className="font-mono font-bold text-blue-600">{info.getValue()}</span>
    },
    {
      header: 'Time',
      accessorKey: 'created_at',
      cell: (info) => format(new Date(info.getValue()), 'hh:mm a')
    },
    {
      header: 'Customer',
      accessorKey: 'customer_name',
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-medium">{info.getValue()}</span>
          <span className="text-xs text-muted-foreground">{info.row.original.phone}</span>
        </div>
      )
    },
    {
      header: 'Service',
      accessorKey: 'service_type',
    },
    {
      header: 'Stylist',
      accessorKey: 'stylist_id',
      cell: (info) => getStylistName(info.getValue())
    },
    {
      header: 'Payment',
      accessorKey: 'payment_status',
      cell: (info) => {
        const status = info.getValue();
        const isPaid = status === 'Paid';
        return (
          <Badge variant={isPaid ? "success" : "secondary"} className={isPaid ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"}>
            {status}
          </Badge>
        );
      }
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex gap-2">
            {row.status === 'Waiting' && (
              <>
                <Button size="sm" onClick={() => handleStatusChange(row.id, 'In Service')} className="bg-blue-600 hover:bg-blue-700 h-8 text-xs">
                  <PlayCircle className="w-3 h-3 mr-1" /> Start
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'Cancelled')} className="text-red-600">
                      <XCircle className="w-4 h-4 mr-2" /> Cancel Booking
                    </DropdownMenuItem>
                    {row.payment_status !== 'Paid' && (
                      <DropdownMenuItem onClick={() => handlePaymentChange(row.id, 'Paid')} className="text-green-600">
                        <Banknote className="w-4 h-4 mr-2" /> Mark as Paid
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {row.status === 'In Service' && (
               <>
                <Button size="sm" onClick={() => handleStatusChange(row.id, 'Completed')} className="bg-green-600 hover:bg-green-700 h-8 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" /> Complete
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'Waiting')}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Return to Queue
                     </DropdownMenuItem>
                     {row.payment_status !== 'Paid' && (
                      <DropdownMenuItem onClick={() => handlePaymentChange(row.id, 'Paid')} className="text-green-600">
                        <Banknote className="w-4 h-4 mr-2" /> Mark as Paid
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
               </>
            )}

            {['Completed', 'Cancelled'].includes(row.status) && (
               <span className="text-xs text-muted-foreground italic">Archived</span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="Booking Management"
        subtitle="Manage queue, appointments and customer flow"
        icon={Calendar}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-2">
             <CardTitle className="text-4xl font-bold text-blue-700">{queueData.length}</CardTitle>
             <CardDescription className="text-blue-600 font-medium">Waiting in Queue</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardHeader className="pb-2">
             <CardTitle className="text-4xl font-bold text-purple-700">{inServiceData.length}</CardTitle>
             <CardDescription className="text-purple-600 font-medium">Currently In Service</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardHeader className="pb-2">
             <CardTitle className="text-4xl font-bold text-green-700">{historyData.filter(h => h.status === 'Completed').length}</CardTitle>
             <CardDescription className="text-green-600 font-medium">Completed Today</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Queue ({queueData.length})
          </TabsTrigger>
          <TabsTrigger value="in-service" className="flex items-center gap-2">
            <Scissors className="h-4 w-4" /> In Service ({inServiceData.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
               <CardTitle>Waiting List</CardTitle>
               <CardDescription>Customers waiting for service</CardDescription>
            </CardHeader>
            <CardContent>
               <DataTable 
                  data={queueData}
                  columns={columns}
                  isLoading={isLoading}
                  searchable
                  searchField="customer_name"
               />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-service">
          <Card>
            <CardHeader>
               <CardTitle>In Progress</CardTitle>
               <CardDescription>Customers currently being served</CardDescription>
            </CardHeader>
            <CardContent>
               <DataTable 
                  data={inServiceData}
                  columns={columns}
                  isLoading={isLoading}
               />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
               <CardTitle>Today's History</CardTitle>
               <CardDescription>Completed and Cancelled bookings</CardDescription>
            </CardHeader>
            <CardContent>
               <DataTable 
                  data={historyData}
                  columns={columns}
                  isLoading={isLoading}
                  searchable
                  searchField="customer_name"
               />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
