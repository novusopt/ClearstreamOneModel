"use client";

import { Minus, Plus } from "@untitledui/icons";
import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  DisclosureGroup as AriaDisclosureGroup,
  type DisclosureGroupProps as AriaDisclosureGroupProps,
  DisclosurePanel as AriaDisclosurePanel,
  Heading as AriaHeading,
} from "react-aria-components";
import { cx } from "@/utils/cx";

/**
 * FAQ accordion following the Untitled UI "FAQ section" anatomy (question row with a +/− icon in a
 * circle, answer in tertiary text, rows divided by a secondary border). The open-source kit has no
 * accordion, so this is built on React Aria's Disclosure primitives.
 */
export const Accordion = ({ className, ...props }: AriaDisclosureGroupProps & { className?: string }) => (
  <AriaDisclosureGroup {...props} className={cx("divide-y divide-secondary border-y border-secondary", className)} />
);

interface AccordionItemProps {
  id: string;
  title: ReactNode;
  children: ReactNode;
}

const AccordionItem = ({ id, title, children }: AccordionItemProps) => (
  <AriaDisclosure id={id} className="group">
    {({ isExpanded }) => (
      <>
        <AriaHeading level={3}>
          <AriaButton
            slot="trigger"
            className="flex w-full cursor-pointer items-start justify-between gap-6 rounded-lg py-6 text-left outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span className="text-lg font-semibold text-primary">{title}</span>
            <span
              aria-hidden="true"
              className={cx(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition duration-200",
                isExpanded ? "border-fg-brand-secondary text-fg-brand-secondary" : "border-fg-quaternary text-fg-quaternary",
              )}
            >
              {isExpanded ? <Minus className="size-3.5" strokeWidth={2.5} /> : <Plus className="size-3.5" strokeWidth={2.5} />}
            </span>
          </AriaButton>
        </AriaHeading>
        <AriaDisclosurePanel className="pr-12 pb-6 text-md text-tertiary">{children}</AriaDisclosurePanel>
      </>
    )}
  </AriaDisclosure>
);

Accordion.Item = AccordionItem;
