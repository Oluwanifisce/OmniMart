// AdminDashboard.jsx — Enterprise admin shell with RBAC-restricted sidebar
// No cart / checkout code. Strictly admin orchestration views.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import AdminAnalytics from './admin/AdminAnalytics'
import AdminCatalog   from './admin/AdminCatalog'
import AdminOrders    from './admin/AdminOrders'
import AdminUsers     from './admin/AdminUsers'
import AdminContent   from './admin/AdminContent'
import AdminVendors   from './admin/AdminVendors'

// ── Sidebar nav structure ──────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    group: 'Overview',
    items: [
      { id: 'analytics', icon: '▣', label: 'Analytics'         },
    ],
  },
  {
    group: 'Commerce',
    items: [
      { id: 'catalog',   icon: '◫', label: 'Catalog'           },
      { id: 'orders',    icon: '↗', label: 'Orders'            },
      { id: 'vendors',   icon: '◈', label: 'Vendors'           },
    ],
  },
  {
    group: 'Platform',
    items: [
      { id: 'users',     icon: '◷', label: 'Users & Access'    },
      { id: 'content',   icon: '✦', label: 'Content & Marketing'},
    ],
  },
]

const SECTION_TITLES = {
  analytics: 'Platform Analytics',
  catalog:   'Catalog Management',
  orders:    'Order Orchestration',
  vendors:   'Vendor Management',
  users:     'User & Access Control',
  content:   'Content & Marketing',
}

const AdminDashboard = () => {
  const [section, setSection] = useState('analytics')
  const { user, logout }      = useAuth()
  const navigate              = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const SectionComponent = {
    analytics: AdminAnalytics,
    catalog:   AdminCatalog,
    orders:    AdminOrders,
    vendors:   AdminVendors,
    users:     AdminUsers,
    content:   AdminContent,
  }[section] || AdminAnalytics

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F1F5F9' }}>

      {/* ══════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════ */}
      <aside style={{ width:240, minHeight:'100vh', background:'#0F172A', position:'fixed',
        top:0, left:0, display:'flex', flexDirection:'column', zIndex:200 }}>

        {/* Brand */}
        <div style={{ padding:'22px 20px 18px', borderBottom:'1px solid #1E293B' }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:'10px',
            textDecoration:'none', color:'#fff' }}>
            {/* SVG bag logo — dark bg version */}
            <svg width="26" height="26" viewBox="0 0 100 110" fill="none">
              <path d="M35 30 Q35 10 50 10 Q65 10 65 30" stroke="#10B981" strokeWidth="7" strokeLinecap="round" fill="none"/>
              <path d="M18 30 L82 30 L88 95 L12 95 Z" fill="#fff" opacity=".9"/>
              <rect x="12" y="55" width="76" height="8" fill="#10B981" opacity="1"/>
            </svg>
            <span style={{ fontWeight:800, fontSize:'17px', letterSpacing:'-.04em' }}>
              Omni<span style={{ color:'#10B981' }}>Mart</span>
            </span>
          </Link>
          <div style={{ fontSize:'9px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase',
            color:'#475569', marginTop:'4px', paddingLeft:'36px' }}>
            Admin Console
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 0', overflowY:'auto' }}>
          {NAV_SECTIONS.map(sec => (
            <div key={sec.group}>
              <div style={{ fontSize:'9.5px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase',
                color:'#475569', padding:'16px 20px 6px' }}>
                {sec.group}
              </div>
              {sec.items.map(item => (
                <button key={item.id}
                  onClick={() => setSection(item.id)}
                  style={{ display:'flex', alignItems:'center', gap:'12px', width:'100%',
                    padding:'9px 20px', fontSize:'13.5px', fontWeight: section === item.id ? 700 : 500,
                    color: section === item.id ? '#fff' : '#94A3B8',
                    background: section === item.id ? '#1E293B' : 'transparent',
                    border: 'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                    borderLeft: section === item.id ? '3px solid #10B981' : '3px solid transparent',
                    transition:'all .15s' }}>
                  <span style={{ fontSize:'14px', opacity: section === item.id ? 1 : .7 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Storefront link */}
        <div style={{ padding:'12px 0', borderTop:'1px solid #1E293B' }}>
          <Link to="/"
            style={{ display:'flex', alignItems:'center', gap:'12px', padding:'9px 20px',
              fontSize:'13px', fontWeight:500, color:'#64748B', textDecoration:'none',
              transition:'color .15s', borderLeft:'3px solid transparent' }}>
            ↗ View Storefront
          </Link>
        </div>

        {/* User */}
        <div style={{ padding:'14px 20px', borderTop:'1px solid #1E293B',
          display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'#1E293B',
            border:'1px solid #334155', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'12px', fontWeight:700, color:'#94A3B8', flexShrink:0 }}>
            {(user?.firstname?.[0] || 'A').toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#E2E8F0',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.firstname} {user?.lastname}
            </div>
            <div style={{ fontSize:'10px', color:'#475569' }}>Administrator</div>
          </div>
          <button onClick={handleLogout}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#475569',
              fontSize:'16px', padding:'4px', transition:'color .15s', lineHeight:1 }}
            title="Sign Out">⏻</button>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════ */}
      <div style={{ marginLeft:240, flex:1, display:'flex', flexDirection:'column' }}>

        {/* Top bar */}
        <div style={{ height:60, background:'#fff', borderBottom:'1px solid #E2E8F0',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 28px', position:'sticky', top:0, zIndex:100 }}>
          <div>
            <h1 style={{ fontSize:'16px', fontWeight:700, margin:0, color:'#0F172A' }}>
              {SECTION_TITLES[section]}
            </h1>
            <p style={{ fontSize:'11px', color:'#94A3B8', margin:0 }}>
              OmniMart Admin Console · {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px',
              borderRadius:'12px', background:'#D1FAE5', color:'#065F46' }}>
              Admin
            </span>
            <button onClick={handleLogout}
              style={{ padding:'7px 14px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
                background:'#fff', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                color:'#64748B', transition:'all .15s' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Page content */}
        <main style={{ flex:1, padding:'28px', overflowY:'auto' }}>
          <SectionComponent />
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
