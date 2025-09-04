import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plane, ArrowLeft } from 'lucide-react';

const CreateTrip: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Create Trip | TravelMate';
    if (!user) navigate('/auth');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const title = (formData.get('title') as string)?.trim();
    const destination = (formData.get('destination') as string)?.trim() || null;
    const start_date = (formData.get('start_date') as string) || null;
    const end_date = (formData.get('end_date') as string) || null;
    const description = (formData.get('description') as string)?.trim() || null;

    if (!title) {
      toast({ title: 'Missing title', description: 'Please enter a trip title.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          title,
          destination,
          start_date,
          end_date,
          description,
          created_by: user.id,
        })
        .select('id')
        .maybeSingle();

      if (error) throw error;

      toast({ title: 'Trip created', description: 'Your trip was created successfully.' });
      // For now, return to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.message || 'Could not create trip';
      toast({ title: 'Create failed', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plane className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">TravelMate</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create a new trip</CardTitle>
            <CardDescription>Set the basics. You can invite friends later.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Trip title</Label>
                <Input id="title" name="title" placeholder="e.g., Bali Getaway" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input id="destination" name="destination" placeholder="City, Country" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start date</Label>
                  <Input id="start_date" name="start_date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End date</Label>
                  <Input id="end_date" name="end_date" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="What is this trip about?" />
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Trip'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default CreateTrip;
