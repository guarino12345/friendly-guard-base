import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Copy, Check, Key, RefreshCw, Download, ChevronDown, ChevronUp } from "lucide-react";

const FUNCTION_URL_PLACEHOLDER = "YOUR_BACKEND_FUNCTION_URL";

function generateApiKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function generatePluginCode(apiKey, functionUrl) {
  return `<?php
/**
 * Plugin Name: Friendly Guard Connector
 * Description: Sends WordPress health checks to the Friendly Guard™ dashboard.
 * Version:     1.0.0
 * Author:      Friendly Guard
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'FG_API_KEY',      '${apiKey}' );
define( 'FG_ENDPOINT',     '${functionUrl}' );
define( 'FG_INTERVAL',     900 ); // seconds between checks (default: 15 min)

// ─────────────────────────────────────────
// Schedule the cron event on activation
// ─────────────────────────────────────────
register_activation_hook( __FILE__, 'fg_activate' );
function fg_activate() {
    if ( ! wp_next_scheduled( 'fg_run_checks' ) ) {
        wp_schedule_event( time(), 'fg_interval', 'fg_run_checks' );
    }
}

register_deactivation_hook( __FILE__, 'fg_deactivate' );
function fg_deactivate() {
    wp_clear_scheduled_hook( 'fg_run_checks' );
}

add_filter( 'cron_schedules', 'fg_cron_interval' );
function fg_cron_interval( $schedules ) {
    $schedules['fg_interval'] = [
        'interval' => FG_INTERVAL,
        'display'  => 'Friendly Guard Interval',
    ];
    return $schedules;
}

add_action( 'fg_run_checks', 'fg_run_all_checks' );

// ─────────────────────────────────────────
// Run all checks and POST to dashboard
// ─────────────────────────────────────────
function fg_run_all_checks() {
    $domain = home_url();
    $checks = [];

    // 1. REST API
    $rest_url  = rest_url( 'wp/v2/types' );
    $rest_resp = wp_remote_get( $rest_url, [ 'timeout' => 10, 'sslverify' => false ] );
    $checks['rest_api'] = [
        'status'     => ( ! is_wp_error( $rest_resp ) && wp_remote_retrieve_response_code( $rest_resp ) === 200 ) ? 'pass' : 'fail',
        'error_type' => 'REST API unreachable',
    ];

    // 2. WP Cron
    $cron_array = _get_cron_array();
    $checks['cron'] = [
        'status'     => ( is_array( $cron_array ) && count( $cron_array ) > 0 ) ? 'pass' : 'fail',
        'error_type' => 'WP Cron array empty',
    ];

    // 3. Plugin updates
    $update_plugins = get_site_transient( 'update_plugins' );
    $has_plugin_updates = isset( $update_plugins->response ) && count( $update_plugins->response ) > 0;
    $checks['plugins'] = [
        'status'     => $has_plugin_updates ? 'fail' : 'pass',
        'message'    => $has_plugin_updates ? count( $update_plugins->response ) . ' plugin(s) need updating' : '',
        'error_type' => 'Plugin updates available',
        'severity'   => 'warning',
    ];

    // 4. Theme updates
    $update_themes = get_site_transient( 'update_themes' );
    $has_theme_updates = isset( $update_themes->response ) && count( $update_themes->response ) > 0;
    $checks['theme'] = [
        'status'     => $has_theme_updates ? 'fail' : 'pass',
        'message'    => $has_theme_updates ? count( $update_themes->response ) . ' theme(s) need updating' : '',
        'error_type' => 'Theme updates available',
        'severity'   => 'warning',
    ];

    // 5. WP Core updates
    $update_core = get_site_transient( 'update_core' );
    $has_core_update = isset( $update_core->updates ) && count( $update_core->updates ) > 1;
    $checks['wp_core'] = [
        'status'     => $has_core_update ? 'fail' : 'pass',
        'error_type' => 'WordPress core update available',
        'severity'   => 'warning',
    ];

    // 6. Elementor CSS / status
    $elementor_active = is_plugin_active( 'elementor/elementor.php' );
    if ( $elementor_active ) {
        $css_files_path = WP_CONTENT_DIR . '/uploads/elementor/css/';
        $css_exists = is_dir( $css_files_path ) && count( glob( $css_files_path . 'post-*.css' ) ) > 0;
        $checks['elementor'] = [
            'status'     => $css_exists ? 'pass' : 'fail',
            'error_type' => 'Elementor CSS files missing',
            'message'    => $css_exists ? '' : 'Regenerate Elementor CSS from the dashboard',
            'severity'   => 'critical',
        ];
    } else {
        $checks['elementor'] = [ 'status' => 'pass' ]; // Not installed, nothing to check
    }

    // 7. SMTP — test wp_mail can initialise
    $smtp_ok = apply_filters( 'fg_smtp_check', null );
    if ( $smtp_ok === null ) {
        // Basic check: if a known SMTP plugin is active, assume configured
        $smtp_plugins = [
            'wp-mail-smtp/wp_mail_smtp.php',
            'easy-wp-smtp/easy-wp-smtp.php',
            'post-smtp/postman-smtp.php',
        ];
        $has_smtp = false;
        foreach ( $smtp_plugins as $p ) {
            if ( is_plugin_active( $p ) ) { $has_smtp = true; break; }
        }
        $smtp_ok = $has_smtp;
    }
    $checks['smtp'] = [
        'status'     => $smtp_ok ? 'pass' : 'fail',
        'error_type' => 'No SMTP plugin detected',
        'severity'   => 'warning',
    ];

    // 8. Frontend load (self-ping)
    $front_resp = wp_remote_get( home_url(), [ 'timeout' => 15, 'sslverify' => false ] );
    $front_code = is_wp_error( $front_resp ) ? 0 : wp_remote_retrieve_response_code( $front_resp );
    $checks['frontend'] = [
        'status'     => ( $front_code >= 200 && $front_code < 400 ) ? 'pass' : 'fail',
        'error_type' => 'Site returned HTTP ' . $front_code,
        'severity'   => 'critical',
    ];

    // Collect versions
    $wp_version       = get_bloginfo( 'version' );
    $elementor_version = defined( 'ELEMENTOR_VERSION' ) ? ELEMENTOR_VERSION : null;

    // POST to Friendly Guard dashboard
    $payload = [
        'api_key'           => FG_API_KEY,
        'domain'            => $domain,
        'checks'            => $checks,
        'wp_version'        => $wp_version,
        'elementor_version' => $elementor_version,
    ];

    wp_remote_post( FG_ENDPOINT, [
        'headers'     => [ 'Content-Type' => 'application/json' ],
        'body'        => wp_json_encode( $payload ),
        'timeout'     => 20,
        'data_format' => 'body',
    ]);
}

// ─────────────────────────────────────────
// Manual trigger via WP Admin toolbar
// ─────────────────────────────────────────
add_action( 'admin_bar_menu', 'fg_admin_bar_trigger', 100 );
function fg_admin_bar_trigger( $wp_admin_bar ) {
    if ( ! current_user_can( 'manage_options' ) ) return;
    $wp_admin_bar->add_node([
        'id'    => 'fg_run_now',
        'title' => '🛡 Run FriendlyGuard Check',
        'href'  => add_query_arg( 'fg_run_now', '1', admin_url() ),
    ]);
}

add_action( 'admin_init', 'fg_manual_trigger' );
function fg_manual_trigger() {
    if ( isset( $_GET['fg_run_now'] ) && current_user_can( 'manage_options' ) ) {
        fg_run_all_checks();
        add_action( 'admin_notices', function() {
            echo '<div class="notice notice-success"><p>Friendly Guard: checks sent to dashboard.</p></div>';
        });
    }
}`;
}

export default function PluginSetup() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [expandedSite, setExpandedSite] = useState(null);
  const [functionUrl, setFunctionUrl] = useState(FUNCTION_URL_PLACEHOLDER);

  useEffect(() => {
    base44.entities.Site.list("-created_date").then((data) => {
      setSites(data);
      setLoading(false);
    });
  }, []);

  const assignKey = async (site) => {
    setSavingId(site.id);
    const api_key = generateApiKey();
    await base44.entities.Site.update(site.id, { api_key });
    setSites((prev) => prev.map((s) => s.id === site.id ? { ...s, api_key } : s));
    setSavingId(null);
    setExpandedSite(site.id);
  };

  const pluginCode = (apiKey) => generatePluginCode(apiKey || "PASTE_YOUR_API_KEY_HERE", functionUrl);

  const downloadPlugin = (site) => {
    const code = pluginCode(site.api_key);
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `friendly-guard-connector-${site.domain.replace(/[^a-z0-9]/gi, "-")}.php`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">WordPress Plugin Setup</h1>
        <p className="text-sm text-zinc-500 mt-1">Generate & install the connector plugin on each client site</p>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-[#2a2a3a] bg-[#16161f] px-6 py-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">How it works</h2>
        <ol className="space-y-2 text-sm text-zinc-400">
          {[
            "Paste your backend function URL below (get it from Dashboard → Code → Functions → wpSync).",
            "For each site, click \"Generate API Key\" to create a unique secret.",
            "Download the generated .php plugin file and upload it to the WordPress site via Plugins → Add New → Upload.",
            "Activate the plugin. It will automatically run checks every 15 minutes and POST results here.",
            "You can also trigger a manual check from the WP Admin bar: \"🛡 Run FriendlyGuard Check\".",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Function URL input */}
      <div className="rounded-2xl border border-[#2a2a3a] bg-[#16161f] px-6 py-5 space-y-2">
        <label className="block text-[11px] text-zinc-500 uppercase tracking-wide font-medium">
          Backend Function URL (wpSync)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={functionUrl}
            onChange={(e) => setFunctionUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 bg-[#111118] border border-[#2a2a3a] rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors font-mono"
          />
          <CopyButton text={functionUrl} />
        </div>
        <p className="text-[11px] text-zinc-600">Find this in: Dashboard → Code → Functions → wpSync → copy the endpoint URL</p>
      </div>

      {/* Sites list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-400">Sites</h2>
        {loading ? (
          <div className="h-32 rounded-2xl bg-[#16161f] border border-[#2a2a3a] animate-pulse" />
        ) : sites.map((site) => (
          <div key={site.id} className="rounded-2xl border border-[#2a2a3a] bg-[#16161f] overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{site.client_name}</p>
                <p className="text-xs text-zinc-500">{site.domain}</p>
              </div>
              <div className="flex items-center gap-2">
                {site.api_key ? (
                  <>
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full font-medium">
                      <Key className="w-3 h-3" /> Key assigned
                    </span>
                    <button
                      onClick={() => downloadPlugin(site)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Plugin
                    </button>
                    <button
                      onClick={() => setExpandedSite(expandedSite === site.id ? null : site.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all"
                    >
                      {expandedSite === site.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => assignKey(site)}
                    disabled={savingId === site.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2a2a3a] text-xs text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-white/5 transition-all disabled:opacity-50"
                  >
                    {savingId === site.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    Generate API Key
                  </button>
                )}
              </div>
            </div>

            {expandedSite === site.id && site.api_key && (
              <div className="border-t border-[#2a2a3a] px-5 py-4 space-y-4">
                {/* API Key display */}
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wide mb-1.5 font-medium">API Key</p>
                  <div className="flex items-center gap-2 bg-[#111118] border border-[#1e1e2a] rounded-xl px-3 py-2">
                    <code className="flex-1 text-xs text-emerald-400 font-mono break-all">{site.api_key}</code>
                    <CopyButton text={site.api_key} />
                  </div>
                </div>

                {/* Plugin code preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium">Plugin Code Preview</p>
                    <CopyButton text={pluginCode(site.api_key)} />
                  </div>
                  <pre className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-4 text-[10px] text-zinc-400 font-mono overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap">
                    {pluginCode(site.api_key)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}