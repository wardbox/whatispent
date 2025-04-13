import { useState, useMemo } from "react";
import { useQuery, getAllTransactions } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { TransactionsList } from "../transactions/components/transactions-list";
import { Input } from "./components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Button } from "./components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { ListFilter, ArrowUpDown } from "lucide-react";
import { getPrettyCategoryName, prettyCategoryNames } from "../utils/categories";

// Define types needed (SortOption can be shared or redefined here)
type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function TransactionsPage() {
  const { data: user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [sortCriteria, setSortCriteria] = useState<SortOption>("date-desc");

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery(
    getAllTransactions,
    undefined, 
    { enabled: !!user }
  );

  // Calculate available categories based on fetched data
  const availableCategories = useMemo(() => {
    if (!transactions) return Object.values(prettyCategoryNames).sort();
    const uniqueCategories = new Set<string>();
    transactions.forEach(tx => {
      const prettyName = getPrettyCategoryName(tx.category?.[0] ?? 'Uncategorized');
      uniqueCategories.add(prettyName);
    });
    return Array.from(uniqueCategories).sort();
  }, [transactions]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (!user) {
    return <p>Please log in to view transactions.</p>;
  }

  return (
    <div className="container mx-auto py-8 space-y-4">
      <h1 className="text-3xl font-bold">All Transactions</h1>
      
      {/* Controls Row */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <ListFilter className="mr-2 h-4 w-4" />
                Filter
                {selectedCategories.size > 0 && ` (${selectedCategories.size})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableCategories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.has(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                  onSelect={(e: Event) => e.preventDefault()} 
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Select value={sortCriteria} onValueChange={(value: string) => setSortCriteria(value as SortOption)}>
            <SelectTrigger className="h-9 w-[180px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (Newest)</SelectItem>
              <SelectItem value="date-asc">Date (Oldest)</SelectItem>
              <SelectItem value="amount-desc">Amount (High-Low)</SelectItem>
              <SelectItem value="amount-asc">Amount (Low-High)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pass data and state down to TransactionsList */}
      <TransactionsList 
        transactions={transactions}
        isLoading={isLoading}
        error={error}
        searchQuery={searchQuery}
        selectedCategories={selectedCategories}
        sortCriteria={sortCriteria}
      />

      {/* Removed old Table structure */}
    </div>
  );
}
