import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  // Allow CORS from WordPress sites
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { api_key, checks, wp_version, elementor_version, domain } = body;

    if (!api_key || !domain) {
      return Response.json({ error: 'api_key and domain are required' }, { status: 400, headers: corsHeaders });
    }

    // Find site by api_key
    const sites = await base44.asServiceRole.entities.Site.filter({ api_key });
    if (!sites || sites.length === 0) {
      return Response.json({ error: 'Invalid api_key' }, { status: 401, headers: corsHeaders });
    }

    const site = sites[0];

    // Build status update object
    const statusMap = {
      plugins:    'plugins_status',
      theme:      'theme_status',
      wp_core:    'wp_core_status',
      elementor:  'elementor_status',
      cron:       'cron_status',
      smtp:       'smtp_status',
      rest_api:   'rest_api_status',
      frontend:   'frontend_status',
      layout:     'layout_status',
      mobile:     'mobile_status',
      call_button:'call_button_status',
      gtm_swap:   'gtm_swap_status',
      form:       'form_status',
    };

    const update = { last_checked: new Date().toISOString() };
    if (wp_version) update.wp_version = wp_version;
    if (elementor_version) update.elementor_version = elementor_version;

    const newAlerts = [];

    for (const [checkKey, statusField] of Object.entries(statusMap)) {
      if (checks && checks[checkKey] !== undefined) {
        const result = checks[checkKey]; // { status: 'pass'|'fail', message?: string }
        const status = result.status || (result === true ? 'pass' : result === false ? 'fail' : 'unknown');
        update[statusField] = status;

        // Create alert log if this check is now failing
        if (status === 'fail') {
          newAlerts.push({
            site_id: site.id,
            domain: site.domain,
            client_name: site.client_name,
            check_name: checkKey,
            error_type: result.error_type || `${checkKey} check failed`,
            message: result.message || '',
            severity: result.severity || 'warning',
            resolved: false,
          });
        }
      }
    }

    // Determine overall status
    const allStatuses = Object.values(statusMap).map((f) => update[f] || site[f]);
    if (allStatuses.some((s) => s === 'fail')) {
      update.status = 'critical';
    } else if (allStatuses.every((s) => s === 'unknown' || !s)) {
      update.status = 'unknown';
    } else {
      update.status = 'healthy';
    }

    // Update site
    await base44.asServiceRole.entities.Site.update(site.id, update);

    // Create new alert logs
    for (const alert of newAlerts) {
      await base44.asServiceRole.entities.AlertLog.create(alert);
    }

    return Response.json({
      success: true,
      site_id: site.id,
      status: update.status,
      alerts_created: newAlerts.length,
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});