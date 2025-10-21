import type { CostService } from "@/types/cost-tracking";
import type { CostEvent } from "./cost-calculator-types";

/**
 * Parameters for summing costs by service
 */
interface SumCostsByServiceParams {
  events: CostEvent[];
  services: CostService[];
}

/**
 * Parameters for counting operations by service
 */
interface CountByServiceParams {
  events: CostEvent[];
  service: CostService;
}

/**
 * Parameters for summing metadata field
 */
interface SumMetadataFieldParams {
  events: CostEvent[];
  field: string;
}

/**
 * Sum costs for specified services
 */
export function sumCostsByService(params: SumCostsByServiceParams): number {
  const { events, services } = params;
  return events
    .filter((event) => services.includes(event.service as CostService))
    .reduce((sum, event) => sum + parseFloat(event.total_cost_usd), 0);
}

/**
 * Count operations for a specific service
 */
export function countByService(params: CountByServiceParams): number {
  const { events, service } = params;
  return events.filter((event) => event.service === service).length;
}

/**
 * Sum a specific metadata field across all events
 */
export function sumMetadataField(params: SumMetadataFieldParams): number {
  const { events, field } = params;
  return events.reduce((sum, event) => {
    const metadata = event.metadata || {};
    const value = metadata[field];
    return sum + (typeof value === "number" ? value : 0);
  }, 0);
}
