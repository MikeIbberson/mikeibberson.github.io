import { load as loadYaml } from "js-yaml";
import raw from "../../content.yaml?raw";

export const content = loadYaml(raw);

/**
@param {string} template @param {Record<string, string | number>} vars
*/
export function fmt(template, vars = {}) {
  return String(template).replaceAll(/\{(\w+)\}/g, (_, key) =>
    vars[key] == null ? "" : String(vars[key])
  );
}

/**
Interactable examine data keyed by prop id
*/
export const ITEMS = content.items ?? {};

/**
Ids that unlock the short-path ticker when all are found
*/
export const PRIMARY_ITEMS = content.primaryItems ?? [];
