"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
  Plus,
  ReceiptText,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Expense = {
  id: string;
  etsy_shop_id: number | null;
  expense_date: string;
  category: string;
  description: string | null;
  amount: number | string;
  currency: string;
  created_at: string;
  updated_at: string;
};

type ExpensesResponse = {
  success: boolean;
  expenses?: Expense[];
  expense?: Expense;
  error?: string;
};

const categories = [
  {
    value: "supplies",
    label: "Supplies",
  },
  {
    value: "packaging",
    label: "Packaging",
  },
  {
    value: "postage",
    label: "Postage",
  },
  {
    value: "advertising",
    label: "Advertising",
  },
  {
    value: "software",
    label: "Software",
  },
  {
    value: "equipment",
    label: "Equipment",
  },
  {
    value: "professional_services",
    label: "Professional Services",
  },
  {
    value: "other",
    label: "Other",
  },
];

function formatMoney(
  value: number | string,
  currency: string,
) {
  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
      },
    ).format(parsed);
  } catch {
    return `${parsed.toFixed(
      2,
    )} ${currency}`;
  }
}

function formatCategory(
  value: string,
) {
  return (
    categories.find(
      (category) =>
        category.value === value,
    )?.label ?? value
  );
}

export default function BusinessExpensesCard() {
  const [
    expenses,
    setExpenses,
  ] = useState<Expense[]>([]);

  const [
    expenseDate,
    setExpenseDate,
  ] = useState(() => {
    const now = new Date();

    return [
      now.getFullYear(),
      String(
        now.getMonth() + 1,
      ).padStart(2, "0"),
      String(
        now.getDate(),
      ).padStart(2, "0"),
    ].join("-");
  });

  const [
    category,
    setCategory,
  ] = useState("supplies");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const loadExpenses =
    useCallback(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/etsy/finance/expenses",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as ExpensesResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Business expenses could not be loaded.",
          );
        }

        setExpenses(
          data.expenses ?? [],
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Business expenses could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadExpenses();
  }, [loadExpenses]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const parsedAmount =
        Number(amount);

      if (
        !Number.isFinite(
          parsedAmount,
        ) ||
        parsedAmount <= 0
      ) {
        throw new Error(
          "Enter a valid expense amount greater than 0.",
        );
      }

      const response = await fetch(
        "/api/etsy/finance/expenses",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            expenseDate,
            category,
            description,
            amount: parsedAmount,
            currency: "USD",
          }),
        },
      );

      const data =
        (await response.json()) as ExpensesResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Business expense could not be saved.",
        );
      }

      setDescription("");
      setAmount("");

      setSuccess(
        "Business expense saved.",
      );

      await loadExpenses();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Business expense could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const totalExpenses =
    expenses.reduce(
      (total, expense) => {
        const parsed =
          typeof expense.amount ===
          "number"
            ? expense.amount
            : Number(
                expense.amount,
              );

        return (
          total +
          (Number.isFinite(parsed)
            ? parsed
            : 0)
        );
      },
      0,
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ReceiptText className="size-5" />
          </div>

          <div>
            <CardTitle>
              Business Expenses
            </CardTitle>

            <CardDescription className="mt-1">
              Add expenses Etsy does not know about,
              such as supplies, outside postage,
              software, advertising, or equipment.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-5"
        >
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Date
            </label>

            <input
              type="date"
              value={expenseDate}
              onChange={(event) =>
                setExpenseDate(
                  event.target.value,
                )
              }
              required
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Category
            </label>

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value,
                )
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Description
            </label>

            <input
              type="text"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="USPS postage"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Amount
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value,
                )
              }
              placeholder="0.00"
              required
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full"
              disabled={isSaving}
            >
              {isSaving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}

              Add Expense
            </Button>
          </div>
        </form>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {success}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">
              Recorded Expenses
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {expenses.length} expense
              {expenses.length === 1
                ? ""
                : "s"}{" "}
              saved
            </p>
          </div>

          <p className="text-lg font-bold">
            {formatMoney(
              totalExpenses,
              "USD",
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <LoaderCircle className="size-6 animate-spin text-primary" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No manual business expenses added yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-170 text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-3 font-medium">
                    Date
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Category
                  </th>

                  <th className="px-3 py-3 font-medium">
                    Description
                  </th>

                  <th className="px-3 py-3 text-right font-medium">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {expenses.map(
                  (expense) => (
                    <tr
                      key={expense.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-3 py-3">
                        {expense.expense_date}
                      </td>

                      <td className="px-3 py-3">
                        {formatCategory(
                          expense.category,
                        )}
                      </td>

                      <td className="px-3 py-3">
                        {expense.description ||
                          "—"}
                      </td>

                      <td className="px-3 py-3 text-right font-medium">
                        {formatMoney(
                          expense.amount,
                          expense.currency ||
                            "USD",
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}