import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Plane, MapPin, Calendar, Users, LogOut } from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  description: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  trip_members: { user_id: string; role: string }[];
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTrips();
  }, [user, navigate]);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          trip_members(user_id, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching trips',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Plane className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Plane className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">TravelMate</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.user_metadata?.full_name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Your Trips</h2>
            <p className="text-muted-foreground mt-2">
              Plan, organize, and track your adventures with friends
            </p>
          </div>
          <Button onClick={() => navigate('/trips/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Trip
          </Button>
        </div>

        {/* Trips Grid */}
        {trips.length === 0 ? (
          <div className="text-center py-12">
            <Plane className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No trips yet</h3>
            <p className="text-muted-foreground mb-6">
              Start planning your first adventure with friends!
            </p>
            <Button onClick={() => navigate('/trips/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Trip
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card 
                key={trip.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="truncate">{trip.title}</span>
                  </CardTitle>
                  {trip.destination && (
                    <CardDescription>{trip.destination}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trip.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {trip.description}
                      </p>
                    )}
                    
                    {(trip.start_date || trip.end_date) && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(trip.start_date)} 
                          {trip.end_date && trip.start_date !== trip.end_date && (
                            ` - ${formatDate(trip.end_date)}`
                          )}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{trip.trip_members.length} member{trip.trip_members.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;