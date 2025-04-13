import { useAuth } from 'wasp/client/auth';
import dayjs from 'dayjs';

export function useSubscriptionStatus() {
  const { data: user, isLoading } = useAuth();

  const subscriptionStatus = user?.subscriptionStatus;
  const trialEndsAt = user?.trialEndsAt ? dayjs(user.trialEndsAt) : null;

  const isActive = subscriptionStatus === 'active';
  const isTrialing = trialEndsAt ? trialEndsAt.isAfter(dayjs()) : false;
  const isSubscribedOrTrialing = isActive || isTrialing;

  return {
    user,
    isLoading,
    subscriptionStatus,
    trialEndsAt,
    isActive,
    isTrialing,
    isSubscribedOrTrialing,
  };
} 
