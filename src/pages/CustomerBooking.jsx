import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Clock, User, Scissors, Smartphone, CheckCircle, Ticket, CreditCard, Banknote, Users, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CustomerBooking() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const [ticketNumbers, setTicketNumbers] = useState([]);
  const [bookingMode, setBookingMode] = useState('single'); // 'single' or 'group'
  
  // Single Booking State
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    service_type: 'Haircut',
    stylist_id: '',
    payment_method: 'Offline'
  });

  // Group Booking State
  const [groupData, setGroupData] = useState({
    primary_name: '',
    phone: '',
    payment_method: 'Offline',
    guests: [
      { id: 1, name: '', service_type: 'Haircut', stylist_id: '' }
    ]
  });

  // Fetch Stylists
  const { data: stylists = [] } = useQuery({
    queryKey: ['stylists', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Employee.list();
      return list.filter(e => String(e.company_id) === String(selectedCompanyId) && e.is_active !== false);
    },
    enabled: !!selectedCompanyId
  });

  // Fetch Current Queue
  const { data: queue = [] } = useQuery({
    queryKey: ['bookingQueue', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Booking.list();
      const today = format(new Date(), 'yyyy-MM-dd');
      return list.filter(b => 
        String(b.company_id) === String(selectedCompanyId) && 
        b.status === 'Waiting' &&
        b.date === today
      ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    },
    enabled: !!selectedCompanyId,
    refetchInterval: 30000 // Refresh every 30s
  });

  const generateTicketNumber = () => {
    // Format: T-{HHMM}-{Random3}
    const timePart = format(new Date(), 'HHmm');
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `T-${timePart}-${randomPart}`;
  };

  const bookMutation = useMutation({
    mutationFn: async () => {
      // Handle Group Booking
      if (bookingMode === 'group') {
        const tickets = [];
        for (const guest of groupData.guests) {
          const newTicket = generateTicketNumber();
          await rcas.entities.Booking.create({
            customer_name: guest.name || `Guest of ${groupData.primary_name}`,
            phone: groupData.phone,
            service_type: guest.service_type,
            stylist_id: guest.stylist_id,
            payment_method: groupData.payment_method,
            ticket_number: newTicket,
            company_id: selectedCompanyId,
            date: format(new Date(), 'yyyy-MM-dd'),
            created_at: new Date().toISOString(),
            status: 'Waiting',
            payment_status: groupData.payment_method === 'Online' ? 'Paid' : 'Pending',
            is_group: true,
            primary_contact: groupData.primary_name
          });
          tickets.push({ name: guest.name, ticket: newTicket });
        }
        return tickets;
      } 
      // Handle Single Booking
      else {
        const newTicket = generateTicketNumber();
        await rcas.entities.Booking.create({
          ...formData,
          ticket_number: newTicket,
          company_id: selectedCompanyId,
          date: format(new Date(), 'yyyy-MM-dd'),
          created_at: new Date().toISOString(),
          status: 'Waiting',
          payment_status: formData.payment_method === 'Online' ? 'Paid' : 'Pending'
        });
        return [{ name: formData.customer_name, ticket: newTicket }];
      }
    },
    onSuccess: (tickets) => {
      toast.success("Booking confirmed! You are added to the queue.");
      setTicketNumbers(tickets);
      
      // Reset Forms
      setFormData({ customer_name: '', phone: '', service_type: 'Haircut', stylist_id: '', payment_method: 'Offline' });
      setGroupData({
        primary_name: '',
        phone: '',
        payment_method: 'Offline',
        guests: [{ id: 1, name: '', service_type: 'Haircut', stylist_id: '' }]
      });
      
      queryClient.invalidateQueries(['bookingQueue']);
    },
    onError: () => toast.error("Failed to book appointment")
  });

  const handleSubmit = () => {
    if (bookingMode === 'single') {
      if (!formData.customer_name || !formData.phone) return toast.error("Name and Phone are required");
      bookMutation.mutate();
    } else {
      if (!groupData.primary_name || !groupData.phone) return toast.error("Primary Name and Phone are required");
      if (groupData.guests.some(g => !g.name)) return toast.error("All guest names are required");
      bookMutation.mutate();
    }
  };

  const handleNewBooking = () => {
    setTicketNumbers([]);
  };

  // Group Handlers
  const addGuest = () => {
    setGroupData(prev => ({
      ...prev,
      guests: [...prev.guests, { id: Date.now(), name: '', service_type: 'Haircut', stylist_id: '' }]
    }));
  };

  const removeGuest = (id) => {
    if (groupData.guests.length <= 1) return;
    setGroupData(prev => ({
      ...prev,
      guests: prev.guests.filter(g => g.id !== id)
    }));
  };

  const updateGuest = (id, field, value) => {
    setGroupData(prev => ({
      ...prev,
      guests: prev.guests.map(g => g.id === id ? { ...g, [field]: value } : g)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <PageHeader 
        title="Online Booking & Waitlist"
        subtitle="Book your appointment and check live status"
        icon={Calendar}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Booking Form or Success View */}
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700 flex items-center gap-2">
               <Scissors className="h-5 w-5" /> Book Appointment
            </CardTitle>
            <CardDescription>Join the queue from here</CardDescription>
          </CardHeader>
          
          {ticketNumbers.length > 0 ? (
            <CardContent className="pt-6 text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Booking Confirmed!</h3>
                <p className="text-slate-500 mb-4">Your ticket numbers are:</p>
                
                <div className="space-y-3">
                  {ticketNumbers.map((t, idx) => (
                    <div key={idx} className="p-3 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex justify-between items-center">
                      <span className="font-medium text-slate-700">{t.name}</span>
                      <span className="font-mono font-bold text-blue-600 tracking-wider text-xl">{t.ticket}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-sm text-slate-500">Please arrive 5 minutes before your estimated time.</p>
              </div>
              <Button onClick={handleNewBooking} variant="outline" className="w-full">
                Book Another
              </Button>
            </CardContent>
          ) : (
            <CardContent className="pt-6 space-y-4">
              <Tabs value={bookingMode} onValueChange={setBookingMode} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="single" className="flex items-center gap-2"><User className="h-4 w-4" /> Single</TabsTrigger>
                  <TabsTrigger value="group" className="flex items-center gap-2"><Users className="h-4 w-4" /> Family / Group</TabsTrigger>
                </TabsList>

                {/* SINGLE BOOKING FORM */}
                <TabsContent value="single" className="space-y-4">
                  <FormField 
                    label="Your Name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    placeholder="Enter your name"
                    icon={User}
                  />
                  <FormField 
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="05XXXXXXXX"
                    icon={Smartphone}
                  />
                  <FormField 
                    label="Service Type"
                    type="select"
                    value={formData.service_type}
                    onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                    options={[
                      { value: 'Haircut', label: 'Haircut' },
                      { value: 'Shave', label: 'Shave' },
                      { value: 'Facial', label: 'Facial' },
                      { value: 'Full Service', label: 'Full Service' }
                    ]}
                  />
                  <FormField 
                    label="Preferred Stylist (Optional)"
                    type="select"
                    value={formData.stylist_id}
                    onChange={(e) => setFormData({...formData, stylist_id: e.target.value})}
                    options={[
                      { value: '', label: 'Any Available Stylist' },
                      ...stylists.map(s => ({ value: s.id, label: s.name }))
                    ]}
                  />
                </TabsContent>

                {/* GROUP BOOKING FORM */}
                <TabsContent value="group" className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-800 mb-4">
                     <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3">Primary Contact</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <FormField 
                          value={groupData.primary_name}
                          onChange={(e) => setGroupData({...groupData, primary_name: e.target.value})}
                          placeholder="Your Name"
                          className="mb-0"
                        />
                        <FormField 
                          value={groupData.phone}
                          onChange={(e) => setGroupData({...groupData, phone: e.target.value})}
                          placeholder="Phone Number"
                          className="mb-0"
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <h4 className="font-medium text-sm text-slate-700">Guests ({groupData.guests.length})</h4>
                       <Button size="sm" variant="outline" onClick={addGuest} className="h-8 text-xs">
                          <Plus className="h-3 w-3 mr-1" /> Add Guest
                       </Button>
                    </div>
                    
                    {groupData.guests.map((guest, index) => (
                      <div key={guest.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 relative group">
                        <div className="absolute top-2 right-2">
                           {groupData.guests.length > 1 && (
                             <button onClick={() => removeGuest(guest.id)} className="text-slate-400 hover:text-red-500">
                               <Trash2 className="h-4 w-4" />
                             </button>
                           )}
                        </div>
                     <div className="space-y-3">
                           <FormField 
                             label={`Guest ${index + 1} Name`}
                             value={guest.name}
                             onChange={(e) => updateGuest(guest.id, 'name', e.target.value)}
                             placeholder="Guest Name"
                           />
                           <div className="grid grid-cols-2 gap-3">
                              <FormField 
                                label="Service"
                                type="select"
                                value={guest.service_type}
                                onChange={(e) => updateGuest(guest.id, 'service_type', e.target.value)}
                                options={[
                                  { value: 'Haircut', label: 'Haircut' },
                                  { value: 'Shave', label: 'Shave' },
                                  { value: 'Facial', label: 'Facial' },
                                  { value: 'Full Service', label: 'Full Service' }
                                ]}
                              />
                              <FormField 
                                label="Stylist"
                                type="select"
                                value={guest.stylist_id}
                                onChange={(e) => updateGuest(guest.id, 'stylist_id', e.target.value)}
                                options={[
                                  { value: '', label: 'Any' },
                                  ...stylists.map(s => ({ value: s.id, label: s.name }))
                                ]}
                              />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="space-y-2 pt-2 border-t">
                <label className="text-sm font-medium leading-none">Payment Method</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer flex flex-col items-center gap-2 transition-all ${
                      (bookingMode === 'single' ? formData.payment_method : groupData.payment_method) === 'Offline' 
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onClick={() => {
                       if (bookingMode === 'single') setFormData({...formData, payment_method: 'Offline'});
                       else setGroupData({...groupData, payment_method: 'Offline'});
                    }}
                  >
                    <Banknote className="h-6 w-6 text-slate-600" />
                    <span className="text-sm font-medium">Pay at Salon</span>
                  </div>
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer flex flex-col items-center gap-2 transition-all ${
                      (bookingMode === 'single' ? formData.payment_method : groupData.payment_method) === 'Online' 
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-slate-50'}`}
                    onClick={() => {
                       if (bookingMode === 'single') setFormData({...formData, payment_method: 'Online'});
                       else setGroupData({...groupData, payment_method: 'Online'});
                    }}
                  >
                    <CreditCard className="h-6 w-6 text-slate-600" />
                    <span className="text-sm font-medium">Pay Online</span>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={bookMutation.isPending}>
                {bookMutation.isPending ? 'Booking...' : (
                  (bookingMode === 'single' ? formData.payment_method : groupData.payment_method) === 'Online' 
                  ? 'Pay & Book' : 'Book Appointment'
                )}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Live Queue */}
        <Card>
          <CardHeader className="bg-emerald-50">
            <CardTitle className="text-emerald-700 flex items-center gap-2">
               <Clock className="h-5 w-5" /> Live Waiting List
            </CardTitle>
            <CardDescription>Current queue status</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
             {queue.length === 0 ? (
               <div className="text-center py-10 text-slate-500">
                 <p className="text-lg font-medium">No waiting line!</p>
                 <p className="text-sm">Walk-ins are welcome immediately.</p>
               </div>
             ) : (
               <div className="space-y-3">
                {queue.map((item, index) => {
                   const stylist = stylists.find(s => String(s.id) === String(item.stylist_id));
                   return (
                     <div key={item.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm">
                       <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-full bg-blue-100 flex flex-col items-center justify-center text-blue-700">
                           <span className="text-xs font-bold">#{index + 1}</span>
                         </div>
                         <div>
                           <div className="flex items-center gap-2">
                             <p className="font-bold text-slate-800 dark:text-slate-100">{item.customer_name}</p>
                             {item.ticket_number && (
                               <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                                 {item.ticket_number}
                               </span>
                             )}
                           </div>
                           <p className="text-xs text-slate-500 dark:text-slate-400">
                             {item.service_type} {stylist ? `with ${stylist.name}` : ''}
                           </p>
                         </div>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                         <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Waiting</span>
                         {item.payment_status === 'Paid' && (
                           <span className="text-[10px] font-medium px-1.5 py-0.5 bg-green-100 text-green-700 rounded border border-green-200">
                             Paid Online
                           </span>
                         )}
                       </div>
                     </div>
                   );
                })}
              </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
