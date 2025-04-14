import { HttpError } from 'wasp/server';
// Import expected generated type (will resolve after main.wasp update)
import type { GetUsers } from 'wasp/server/operations';
import { type User } from 'wasp/entities'; // Assuming this path is correct

// We define a specific output type to control what data is sent to the client.
// This should match the FetchedUser type in AdminPage.tsx
type GetUsersOutput = Pick<
  User,
  'id' | 'email' | 'username' | 'isAdmin' | 'subscriptionStatus' | 'createdAt'
> & {
  _count: {
    institutions: number;
    accounts: number;
  };
};

export const getUsers = (async (
  _args,
  context,
) => {
  // Type guard for context.user and context.entities
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Unauthorized. You must be an admin to view users.');
  }
   // Ensure entities are available. This should be guaranteed if declared in main.wasp,
   // but checking adds robustness during development.
  if (!context.entities?.User || !context.entities?.Institution || !context.entities?.Account) {
     throw new HttpError(500, 'Internal server error: Entities not available in context.');
  }

  const users = await context.entities.User.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
      subscriptionStatus: true,
      createdAt: true,
      institutions: { // We still need institutions to count accounts
        select: {
          _count: {
            select: { accounts: true }
          }
        }
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Infer the type structure from the actual query result for robustness
   type UserWithInstitutionCount = (typeof users)[number];
   // Ensure we handle potential null/undefined for _count correctly
   type InstitutionWithAccountCount = {
       _count: { accounts: number | null } | null;
   };


  return users.map((user: UserWithInstitutionCount) => {
     // Explicitly type accumulator and current value in reduce
    const totalAccounts = user.institutions.reduce(
        (sum: number, inst: InstitutionWithAccountCount) => sum + (inst._count?.accounts || 0),
        0 // Provide initial value for reduce
     );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { institutions, ...restOfUser } = user;
    return {
      ...restOfUser,
      _count: {
        institutions: user.institutions.length,
        accounts: totalAccounts,
      },
    };
  });
}) satisfies GetUsers<void, GetUsersOutput[]>;
