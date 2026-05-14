import { describe, expect, it } from "vitest";
import {
  areSettlementPaymentFilesEqual,
  normalizeSettlementPaymentFiles,
} from "@/lib/settlement-payment-files";

describe("settlement payment files", () => {
  it("normalizes runtime string sizes into numeric file metadata", () => {
    const files = normalizeSettlementPaymentFiles([
      {
        id: "file-1",
        name: "proof.pdf",
        size: "4495",
        path: "/uploads/20260511/proof.pdf",
        type: "application/pdf",
        url: "https://demo-resource.mistorebox.com/uploads/20260511/proof.pdf",
        role: "KOL_ADMIN",
        mail: "vela-admin@yuanqutech.com",
        username: "vela-admin",
      },
    ]);

    expect(files).toEqual([
      {
        id: "file-1",
        name: "proof.pdf",
        size: 4495,
        path: "/uploads/20260511/proof.pdf",
        type: "application/pdf",
        url: "https://demo-resource.mistorebox.com/uploads/20260511/proof.pdf",
        role: "KOL_ADMIN",
        mail: "vela-admin@yuanqutech.com",
        username: "vela-admin",
      },
    ]);
  });

  it("converts legacy string entries into complete attachment objects", () => {
    const files = normalizeSettlementPaymentFiles("https://demo-resource.mistorebox.com/uploads/20260511/proof.pdf");

    expect(files).toEqual([
      {
        id: "",
        name: "proof.pdf",
        size: 0,
        path: "",
        type: "",
        url: "https://demo-resource.mistorebox.com/uploads/20260511/proof.pdf",
        role: "",
        mail: "",
        username: "",
      },
    ]);
  });

  it("detects attachment changes using normalized metadata", () => {
    const current = [
      {
        id: "file-1",
        name: "proof.pdf",
        size: 4495,
        path: "/uploads/20260511/proof.pdf",
        type: "application/pdf",
        url: "https://demo-resource.mistorebox.com/uploads/20260511/proof.pdf",
        role: "KOL_ADMIN",
        mail: "vela-admin@yuanqutech.com",
        username: "vela-admin",
      },
    ];
    const same = [
      {
        id: "file-1",
        name: "proof.pdf",
        size: "4495",
        path: "/uploads/20260511/proof.pdf",
        type: "application/pdf",
        url: "https://demo-resource.mistorebox.com/uploads/20260511/proof.pdf",
        role: "KOL_ADMIN",
        mail: "vela-admin@yuanqutech.com",
        username: "vela-admin",
      },
    ];
    const changed = [
      {
        id: "file-2",
        name: "proof-2.pdf",
        size: 1024,
        path: "/uploads/20260511/proof-2.pdf",
        type: "application/pdf",
        url: "https://demo-resource.mistorebox.com/uploads/20260511/proof-2.pdf",
        role: "KOL_ADMIN",
        mail: "vela-admin@yuanqutech.com",
        username: "vela-admin",
      },
    ];

    expect(areSettlementPaymentFilesEqual(current, same)).toBe(true);
    expect(areSettlementPaymentFilesEqual(current, changed)).toBe(false);
  });
});
