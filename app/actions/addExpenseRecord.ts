"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "../lib/db";

// Interface cho dữ liệu record
interface RecordData {
  text: string;
  amount: number;
  category: string;
  date: string;
}

interface RecordResult {
  data?: RecordData;
  error?: string;
}

export default async function addExpenseRecord(
  formData: FormData
): Promise<RecordResult> {
  // Lấy dữ liệu từ form
  const textValue = formData.get("text");
  const amountValue = formData.get("amount");
  const categoryValue = formData.get("category");
  const dateValue = formData.get("date");

  // Kiểm tra dữ liệu đầu vào
  if (
    !textValue ||
    textValue === "" ||
    !amountValue ||
    !categoryValue ||
    categoryValue === "" ||
    !dateValue ||
    dateValue === ""
  ) {
    return { error: "Text, amount, category, or date is missing" };
  }

  const text: string = textValue.toString();
  const amount: number = parseFloat(amountValue.toString());
  const category: string = categoryValue.toString();

  // Xử lý date sang ISO string (YYYY-MM-DD)
  let date: string;
  try {
    const inputDate = dateValue.toString();
    const [year, month, day] = inputDate.split("-");
    const dateObj = new Date(
      Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0)
    );
    date = dateObj.toISOString();
  } catch (error) {
    console.error("Invalid date format:", error);
    return { error: "Invalid date format" };
  }

  // Lấy userId từ Clerk
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { error: "User not found" };

  try {
    // Lấy thông tin chi tiết từ Clerk bằng cách gọi clerkClient()
    const clerkClientInstance = await clerkClient();
    const clerkUser = await clerkClientInstance.users.getUser(clerkUserId);

    // Tìm user trong database
    let user = await db.user.findUnique({
      where: { clerkUserId },
    });

    // Nếu user chưa có trong DB, tạo mới
    if (!user) {
      user = await db.user.create({
        data: {
          clerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name:
            [clerkUser.firstName, clerkUser.lastName]
              .filter(Boolean)
              .join(" ") || "",
          imageUrl: clerkUser.imageUrl || "",
        },
      });
    }

    // Tạo record mới
    const createdRecord = await db.record.create({
      data: {
        text,
        amount,
        category,
        date,
        userId: user.clerkUserId,
      },
    });

    const recordData: RecordData = {
      text: createdRecord.text,
      amount: createdRecord.amount,
      category: createdRecord.category,
      date: createdRecord.date.toISOString(),
    };

    // Revalidate path (nếu dùng Next.js app router)
    revalidatePath("/");

    return { data: recordData };
  } catch (error) {
    console.error("Error adding expense record:", error);
    return {
      error: "An unexpected error occurred while adding the expense record.",
    };
  }
}
