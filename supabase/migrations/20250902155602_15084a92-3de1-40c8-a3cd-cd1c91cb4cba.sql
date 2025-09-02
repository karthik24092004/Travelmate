-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trip_members table for managing who's in each trip
CREATE TABLE public.trip_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Create itinerary_items table for daily activities
CREATE TABLE public.itinerary_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  activity_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  estimated_cost DECIMAL(10,2),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  itinerary_item_id UUID REFERENCES public.itinerary_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  paid_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_participants table for tracking who participates in each expense
CREATE TABLE public.expense_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_amount DECIMAL(10,2),
  UNIQUE(expense_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for trips
CREATE POLICY "Trip members can view trips" ON public.trips FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.trip_members WHERE trip_id = trips.id
  )
);
CREATE POLICY "Users can create trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Trip admins can update trips" ON public.trips FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM public.trip_members WHERE trip_id = trips.id AND role = 'admin'
  )
);
CREATE POLICY "Trip creators can delete trips" ON public.trips FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for trip_members
CREATE POLICY "Trip members can view trip members" ON public.trip_members FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.trip_members tm WHERE tm.trip_id = trip_members.trip_id
  )
);
CREATE POLICY "Trip admins can manage members" ON public.trip_members FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM public.trip_members WHERE trip_id = trip_members.trip_id AND role = 'admin'
  )
);

-- RLS Policies for itinerary_items
CREATE POLICY "Trip members can view itinerary items" ON public.itinerary_items FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.trip_members WHERE trip_id = itinerary_items.trip_id
  )
);
CREATE POLICY "Trip members can create itinerary items" ON public.itinerary_items FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.trip_members WHERE trip_id = itinerary_items.trip_id
  ) AND auth.uid() = created_by
);
CREATE POLICY "Trip members can update itinerary items" ON public.itinerary_items FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM public.trip_members WHERE trip_id = itinerary_items.trip_id
  )
);
CREATE POLICY "Item creators and admins can delete itinerary items" ON public.itinerary_items FOR DELETE USING (
  auth.uid() = created_by OR auth.uid() IN (
    SELECT user_id FROM public.trip_members WHERE trip_id = itinerary_items.trip_id AND role = 'admin'
  )
);

-- RLS Policies for expenses
CREATE POLICY "Trip members can view expenses" ON public.expenses FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.trip_members WHERE trip_id = expenses.trip_id
  )
);
CREATE POLICY "Trip members can create expenses" ON public.expenses FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.trip_members WHERE trip_id = expenses.trip_id
  ) AND auth.uid() = paid_by
);
CREATE POLICY "Expense payers and admins can update expenses" ON public.expenses FOR UPDATE USING (
  auth.uid() = paid_by OR auth.uid() IN (
    SELECT user_id FROM public.trip_members WHERE trip_id = expenses.trip_id AND role = 'admin'
  )
);
CREATE POLICY "Expense payers and admins can delete expenses" ON public.expenses FOR DELETE USING (
  auth.uid() = paid_by OR auth.uid() IN (
    SELECT user_id FROM public.trip_members WHERE trip_id = expenses.trip_id AND role = 'admin'
  )
);

-- RLS Policies for expense_participants
CREATE POLICY "Trip members can view expense participants" ON public.expense_participants FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.trip_members tm 
    JOIN public.expenses e ON tm.trip_id = e.trip_id 
    WHERE e.id = expense_participants.expense_id
  )
);
CREATE POLICY "Trip members can manage expense participants" ON public.expense_participants FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM public.trip_members tm 
    JOIN public.expenses e ON tm.trip_id = e.trip_id 
    WHERE e.id = expense_participants.expense_id
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_itinerary_items_updated_at BEFORE UPDATE ON public.itinerary_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();