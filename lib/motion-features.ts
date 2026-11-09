// Animation features for <LazyMotion>: split into their own chunk so the first paint only ships
// motion's small core (the `m` components); this loads right after.
export { domMax as default } from "motion/react";
