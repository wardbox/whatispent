import { HttpError } from 'wasp/server';
import { type GetUserSubscriptionStatus } from 'wasp/server/operations';

type GetUserSubscriptionStatusResult = { subscriptionStatus: string | null };

export const getUserSubscriptionStatus = (async (
  _args: unknown,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authenticated');
  }

  // Fetch the user with only the subscriptionStatus field
  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    select: { subscriptionStatus: true },
  });

  if (!user) {
    // This should technically not happen if context.user exists,
    // but adding a check for robustness.
    throw new HttpError(404, 'User not found');
  }

  return {
    subscriptionStatus: user.subscriptionStatus,
  };
}) satisfies GetUserSubscriptionStatus<void, GetUserSubscriptionStatusResult>; 
