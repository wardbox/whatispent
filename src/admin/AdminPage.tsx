import React from 'react';
import { useQuery } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { getUsers } from 'wasp/client/operations';
import { Link } from 'wasp/client/router';

// Define the expected shape of the user data coming from the getUsers query
// This matches the GetUsersOutput type defined in the backend query
type FetchedUser = {
  id: string;
  email: string | null;
  username: string | null;
  isAdmin: boolean;
  subscriptionStatus: string | null;
  createdAt: Date; // Prisma dates are Date objects
  _count: {
    institutions: number;
    accounts: number;
  };
}

function AdminPage(): JSX.Element { // Explicit return type for React component
  const { data: user, isLoading: isAuthLoading } = useAuth();
  
  // Use the defined FetchedUser type for the query data
  const { data: users, isLoading: isUsersLoading, error: usersError } = useQuery(getUsers, undefined, {
    // Only run the query if the user is loaded and is an admin
    enabled: !!user?.isAdmin,
  });

  if (isAuthLoading) {
    return <div>Loading user data...</div>;
  }

  // Check if user is logged in and is an admin *after* loading finishes
  if (!user) {
     // Should be caught by authRequired on the page route, but good practice
    return <div>Please log in to view this page.</div>;
  }

  if (!user.isAdmin) {
    // If the user is logged in but not an admin
    return (
      <div className='p-4'>
        <p className='text-red-600'>You are not authorized to view this page.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-blue-500 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  // Handle query loading and errors specifically for the users list
  if (isUsersLoading) {
    return <div>Loading users...</div>;
  }

  // Check for specific permission error from the query itself
  if (usersError) {
    let errorMessage = 'Error fetching users.';
    if (usersError instanceof Error) {
      const httpError = usersError as any;
      // Check status code for auth errors without needing HttpError type
      if (httpError?.statusCode === 403) { 
        errorMessage = 'Error: You are not authorized to view users.';
      } else {
        errorMessage = `Error fetching users: ${usersError.message}`;
      }
    } 
    return <div className='p-4 text-red-600'>{errorMessage}</div>;
  }


  return (
    <div className='p-4 w-full'>
      <h1 className='text-2xl font-bold mb-4'>Admin Portal - Users</h1>
      {users && users.length > 0 ? (
        <div className="overflow-x-auto"> {/* Added for responsiveness */}
          <table className='min-w-full divide-y divide-gray-200 border border-gray-200 shadow-sm'>
            <thead className='bg-gray-50'>
              <tr>
                <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Email</th>
                <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Username</th>
                <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Subscription</th>
                <th scope='col' className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>Inst.</th>
                <th scope='col' className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>Accts.</th>
                <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Created At</th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {users.map((u: FetchedUser) => ( // Explicit type for map item
                <tr key={u.id}>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{u.email || '-'}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{u.username || '-'}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{u.subscriptionStatus || 'N/A'}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center'>{u._count.institutions}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center'>{u._count.accounts}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>No users found or you may not have permission.</div>
      )}
      <Link to="/dashboard" className="mt-4 inline-block text-blue-500 hover:underline">Back to Dashboard</Link>
    </div>
  );
}

export default AdminPage; 
