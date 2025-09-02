import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Plane, Users, DollarSign, MapPin, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Plane className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <div className="flex justify-center items-center space-x-3 mb-8">
            <Plane className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">TravelMate</h1>
          </div>
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Plan Amazing Trips
            <br />
            <span className="text-primary">With Friends</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Organize group trips, track expenses, and create unforgettable memories together. 
            The easiest way to plan collaborative adventures.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </header>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Invite Friends</h3>
            <p className="text-muted-foreground">
              Easily invite friends to join your trip and collaborate on planning together.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Plan Itinerary</h3>
            <p className="text-muted-foreground">
              Create day-by-day itineraries with activities, locations, and timing.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Track Expenses</h3>
            <p className="text-muted-foreground">
              Automatically calculate who owes what and settle expenses fairly.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card rounded-lg p-8 border border-border">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to start your next adventure?
          </h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of travelers who trust TravelMate for their group trips.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Create Your First Trip
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
