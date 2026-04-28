import { z } from "zod";

const numericIdField = z.coerce.number().int().positive("Please select a valid option.");

export const marketingMaterialFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    description: z.string().trim().optional().default(""),
    materialType: z.string().trim().min(1, "Material type is required."),
    legacyMaterialType: z.string().trim().optional().default(""),
    languageId: numericIdField,
    categoryId: numericIdField,
    channelIds: z.array(z.number().int().positive()).min(1, "Select at least one channel."),
    scopeIds: z.array(z.number().int().positive()).min(1, "Select at least one scope."),
    fileId: z.number().int().positive().optional(),
    coverFileId: z.number().int().positive().optional(),
    cooperationSampleUrl: z.string().trim().optional().default(""),
    copyCode: z.string().trim().optional().default(""),
    size: z.string().trim().optional().default(""),
    fileType: z.string().trim().optional().default(""),
  })
  .superRefine((value, ctx) => {
    const isCooperationSample = value.materialType.trim().toLowerCase() === "cooperation_sample";
    if (isCooperationSample) {
      if (!value.cooperationSampleUrl.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cooperationSampleUrl"],
          message: "Cooperation sample URL is required for cooperation_sample materials.",
        });
      }
      return;
    }
    if (!value.fileId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileId"],
        message: "A file upload is required for this material type.",
      });
    }
  });

export const marketingActivityFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().optional().default(""),
  languageId: numericIdField,
  categoryId: numericIdField,
  channelIds: z.array(z.number().int().positive()).min(1, "Select at least one channel."),
  scopeIds: z.array(z.number().int().positive()).min(1, "Select at least one scope."),
  coverFileId: z.number().int().positive().optional(),
  carousel: z.boolean(),
  landingUrl: z.string().trim().url("Landing URL must be a valid URL."),
});

export const marketingTaxonomyFormSchema = z.object({
  code: z.string().trim().min(1, "Code is required."),
  name: z.string().trim().min(1, "Name is required."),
  locale: z.string().trim().optional().default(""),
  sort: z.coerce.number().int().default(0),
  enabled: z.boolean(),
});

export const marketingReviewFormSchema = z.object({
  decision: z.enum(["REVIEW_DECISION_APPROVE", "REVIEW_DECISION_REJECT"]),
  comment: z.string().trim().optional().default(""),
});

export const marketingGenerateLinkFormSchema = z.object({
  activityId: numericIdField,
  affiliateId: z.string().trim().min(1, "Affiliate ID is required."),
  affiliateName: z.string().trim().optional().default(""),
  channelId: numericIdField,
  forceRegenerate: z.boolean(),
});

export const marketingBatchLinkFormSchema = z.object({
  activityId: numericIdField,
  affiliateIdsText: z.string().trim().min(1, "Enter at least one affiliate ID."),
  channelId: numericIdField,
  forceRegenerate: z.boolean(),
});

export type MarketingMaterialFormValues = z.infer<typeof marketingMaterialFormSchema>;
export type MarketingActivityFormValues = z.infer<typeof marketingActivityFormSchema>;
export type MarketingTaxonomyFormValues = z.infer<typeof marketingTaxonomyFormSchema>;
export type MarketingReviewFormValues = z.infer<typeof marketingReviewFormSchema>;
export type MarketingGenerateLinkFormValues = z.infer<typeof marketingGenerateLinkFormSchema>;
export type MarketingBatchLinkFormValues = z.infer<typeof marketingBatchLinkFormSchema>;
