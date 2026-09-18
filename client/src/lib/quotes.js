// Unified quote payload builder — single place that shapes POST /api/quotes bodies.
// Sources: 'inquiry-drawer' | 'custom-trade' | 'factory-visit' | 'generic'.
// Returns a plain object of server quote fields; callers doing multipart
// (CAD file upload) append each entry to FormData themselves.

export function buildQuotePayload(source, fields = {}) {
  const pick = (v, fallback = '') => (v === undefined || v === null ? fallback : v);

  switch (source) {
    case 'inquiry-drawer': {
      const items = Array.isArray(fields.items) ? fields.items : [];
      const piecesSummary = items.length > 0
        ? items.map((i) => `${i.product_name} (${i.finish_selected}) × ${i.quantity}`).join(', ')
        : 'General inquiry';
      return {
        client_name: pick(fields.client_name),
        client_phone: pick(fields.client_phone),
        client_email: pick(fields.client_email),
        organization: pick(fields.city || fields.organization, 'Private Client'),
        project_type: pick(fields.project_type, 'Direct Factory Commission'),
        wood_preference: pick(fields.wood_preference || items[0]?.wood_type, 'Seasoned Sheesham'),
        target_dimensions: pick(fields.target_dimensions, `Selected Pieces: ${piecesSummary}`),
        estimated_budget_inr: Number(fields.totalEstimate ?? fields.estimated_budget_inr ?? 0) || 0,
        project_notes: pick(fields.notes ?? fields.project_notes),
      };
    }

    case 'custom-trade': {
      const dims = fields.target_dimensions
        || `${pick(fields.length_mm, 0)} × ${pick(fields.width_mm, 0)} × ${pick(fields.height_mm, 0)} mm`;
      const notes = [pick(fields.project_notes), fields.inlay_hardware ? `Inlay: ${fields.inlay_hardware}` : '']
        .filter(Boolean)
        .join(' | ');
      return {
        client_name: pick(fields.client_name),
        client_email: pick(fields.client_email),
        client_phone: pick(fields.client_phone),
        organization: pick(fields.organization),
        project_type: pick(fields.project_type, 'Residential Penthouse'),
        wood_preference: pick(fields.wood_preference, 'Seasoned Sheesham'),
        target_dimensions: dims,
        estimated_budget_inr: Number(fields.finalEstimate ?? fields.estimated_budget_inr ?? 0) || 0,
        project_notes: notes,
      };
    }

    case 'factory-visit': {
      const visitLine = fields.preferred_date ? `Preferred visit date: ${fields.preferred_date}. ` : '';
      const interestLine = fields.interests ? `Interests: ${fields.interests}. ` : '';
      const orgLine = fields.organization ? `Org: ${fields.organization}. ` : '';
      return {
        client_name: pick(fields.name ?? fields.client_name),
        client_email: pick(fields.email ?? fields.client_email),
        client_phone: pick(fields.phone ?? fields.client_phone),
        organization: pick(fields.organization, 'Private Client'),
        project_type: 'Factory Visit',
        wood_preference: pick(fields.wood_preference, 'Seasoned Sheesham'),
        target_dimensions: pick(fields.target_dimensions, 'Basni Phase II plant tour'),
        estimated_budget_inr: Number(fields.estimated_budget_inr ?? 0) || 0,
        project_notes: `${visitLine}${interestLine}${orgLine}${pick(fields.notes ?? fields.project_notes)}`.trim(),
      };
    }

    default: {
      return {
        client_name: pick(fields.client_name ?? fields.name),
        client_email: pick(fields.client_email ?? fields.email),
        client_phone: pick(fields.client_phone ?? fields.phone),
        organization: pick(fields.organization, 'Private Commission'),
        project_type: pick(fields.project_type, 'Residential Penthouse'),
        wood_preference: pick(fields.wood_preference, 'Seasoned Sheesham'),
        target_dimensions: pick(fields.target_dimensions, 'Custom Architectural Dimensions'),
        estimated_budget_inr: Number(fields.estimated_budget_inr ?? 0) || 150000,
        project_notes: pick(fields.project_notes ?? fields.notes),
      };
    }
  }
}

export default { buildQuotePayload };
