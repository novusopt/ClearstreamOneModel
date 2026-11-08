"use client";

import { Palette } from "@untitledui/icons";
import { motion } from "motion/react";
import { Heading as AriaHeading } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { TAJWEED_RULES } from "@/lib/constants";

export function TajweedLegend({ compact = false }: { compact?: boolean }) {
  return (
    <DialogTrigger>
      <Button size="sm" color="secondary" iconLeading={Palette}>
        {compact ? "Legend" : "Tajweed legend"}
      </Button>
      <ModalOverlay isDismissable>
        <Modal className="max-w-2xl">
          <Dialog aria-label="Tajweed colour legend">
            {({ close }) => (
              <div className="p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <AriaHeading slot="title" className="text-lg font-semibold text-primary">
                      Tajweed colour guide
                    </AriaHeading>
                    <p className="mt-1 text-sm text-tertiary">Each colour marks a recitation rule, following the Quran.com convention.</p>
                  </div>
                  <CloseButton size="sm" onClick={close} />
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {TAJWEED_RULES.map((r, i) => (
                    <motion.li
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex gap-3 rounded-xl bg-secondary p-3 ring-1 ring-secondary"
                    >
                      <span className={`tj-${r.classes[0]} mt-1 size-3 shrink-0 rounded-full bg-current`} aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="flex items-baseline justify-between gap-2 text-sm font-semibold text-primary">
                          {r.name}
                          <span lang="ar" dir="rtl" className={`tj-${r.classes[0]} font-quran text-lg leading-none`}>
                            {r.arabic}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-tertiary">{r.description}</p>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
