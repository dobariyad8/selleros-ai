import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";

import {
  createEtsyRepository,
  EtsyAccessError,
} from "@/lib/etsy/createRepository";

import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const allowedCategories = [
  "supplies",
  "packaging",
  "postage",
  "advertising",
  "software",
  "equipment",
  "professional_services",
  "other",
] as const;

type ExpenseCategory =
  (typeof allowedCategories)[number];

type CreateExpenseInput = {
  expenseDate?: unknown;
  category?: unknown;
  description?: unknown;
  amount?: unknown;
  currency?: unknown;
};

function readText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readNumber(
  value: unknown,
) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function isExpenseCategory(
  value: string,
): value is ExpenseCategory {
  return (
    allowedCategories as readonly string[]
  ).includes(value);
}

function isValidDate(
  value: string,
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value,
  );
}

export async function GET(
  request: NextRequest,
) {
  try {
    const { user } =
      await requireProSubscription();

    const {
      repository,
    } = await createEtsyRepository(
      request,
    );

    const shop =
      await repository.getShop();

    const minDate =
      readText(
        request.nextUrl.searchParams.get(
          "minDate",
        ),
      );

    const maxDate =
      readText(
        request.nextUrl.searchParams.get(
          "maxDate",
        ),
      );

    let query =
      supabaseAdmin
        .from("etsy_business_expenses")
        .select(
          `
            id,
            etsy_shop_id,
            expense_date,
            category,
            description,
            amount,
            currency,
            created_at,
            updated_at
          `,
        )
        .eq("user_id", user.id)
        .eq(
          "etsy_shop_id",
          shop.shopId,
        )
        .order(
          "expense_date",
          {
            ascending: false,
          },
        );

    if (
      minDate &&
      isValidDate(minDate)
    ) {
      query =
        query.gte(
          "expense_date",
          minDate,
        );
    }

    if (
      maxDate &&
      isValidDate(maxDate)
    ) {
      query =
        query.lte(
          "expense_date",
          maxDate,
        );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "Business expenses lookup failed:",
        error,
      );

      throw new Error(
        "SellerOS could not load business expenses.",
      );
    }

    return NextResponse.json({
      success: true,
      expenses: data ?? [],
    });
  } catch (error) {
    if (
      error instanceof
      SubscriptionAccessError
    ) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    if (
      error instanceof EtsyAccessError
    ) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    console.error(
      "Business expenses GET failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "SellerOS could not load business expenses.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const { user } =
      await requireProSubscription();

    const {
      repository,
    } = await createEtsyRepository(
      request,
    );

    const shop =
      await repository.getShop();

    const body =
      (await request.json()) as CreateExpenseInput;

    const expenseDate =
      readText(
        body.expenseDate,
      );

    if (
      !expenseDate ||
      !isValidDate(
        expenseDate,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid expense date is required.",
        },
        {
          status: 400,
        },
      );
    }

    const category =
      readText(
        body.category,
      );

    if (
      !isExpenseCategory(
        category,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid expense category is required.",
        },
        {
          status: 400,
        },
      );
    }

    const amount =
      readNumber(
        body.amount,
      );

    if (
      amount === null ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Expense amount must be greater than 0.",
        },
        {
          status: 400,
        },
      );
    }

    const description =
      readText(
        body.description,
      );

    const currency =
      readText(
        body.currency,
      ) || "USD";

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("etsy_business_expenses")
      .insert({
        user_id: user.id,

        etsy_shop_id:
          shop.shopId,

        expense_date:
          expenseDate,

        category,

        description:
          description || null,

        amount,

        currency,
      })
      .select(
        `
          id,
          etsy_shop_id,
          expense_date,
          category,
          description,
          amount,
          currency,
          created_at,
          updated_at
        `,
      )
      .single();

    if (error) {
      console.error(
        "Business expense save failed:",
        error,
      );

      throw new Error(
        "SellerOS could not save the business expense.",
      );
    }

    return NextResponse.json({
      success: true,
      expense: data,
    });
  } catch (error) {
    if (
      error instanceof
      SubscriptionAccessError
    ) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    if (
      error instanceof EtsyAccessError
    ) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    console.error(
      "Business expenses POST failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "SellerOS could not save the business expense.",
      },
      {
        status: 500,
      },
    );
  }
}