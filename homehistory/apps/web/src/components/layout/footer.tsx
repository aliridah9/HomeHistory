import * as React from "react"
import { Link } from "react-router-dom"
import { Container } from "./Layout"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Property Search", href: "/search" },
        { name: "AI Scoring", href: "/features/scoring" },
        { name: "Property Reports", href: "/features/reports" },
        { name: "Recommendations", href: "/features/recommendations" },
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Press", href: "/press" },
        { name: "Contact", href: "/contact" },
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Blog", href: "/blog" },
        { name: "Help Center", href: "/help" },
        { name: "API Documentation", href: "/docs" },
        { name: "Status", href: "/status" },
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "Data Protection", href: "/data-protection" },
      ]
    }
  ]

  const socialLinks = [
    { name: "Twitter", href: "https://twitter.com/homehistory", icon: "𝕏" },
    { name: "LinkedIn", href: "https://linkedin.com/company/homehistory", icon: "in" },
    { name: "GitHub", href: "https://github.com/homehistory", icon: "⚡" },
  ]

  return (
    <footer className="border-t bg-muted/30">
      <Container>
        <div className="py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-text-primary mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="border-t pt-8 mb-8">
            <div className="max-w-md">
              <h3 className="font-semibold text-text-primary mb-2">
                Stay Updated
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Get the latest property insights and market updates.
              </p>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                />
                <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Logo and Copyright */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <span className="text-xs font-bold">H</span>
                </div>
                <span className="font-bold bg-gradient-to-r from-ai-gradient-from to-ai-gradient-to bg-clip-text text-transparent">
                  HomeHistory
                </span>
              </Link>
              <span className="text-sm text-text-secondary">
                © {currentYear} HomeHistory. All rights reserved.
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-text-secondary">Follow us:</span>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-primary/10 transition-colors"
                  aria-label={social.name}
                >
                  <span className="text-sm">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 pt-4 border-t">
            <p className="text-xs text-text-tertiary text-center">
              HomeHistory provides property insights and analysis for informational purposes only. 
              Property data accuracy is not guaranteed. Consult with real estate professionals before making decisions.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}