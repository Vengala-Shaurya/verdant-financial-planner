import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#777777"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "VERDANT — Personal Finance, Intentionally Planned | Technical Project Report")
            self.setStrokeColor(colors.HexColor("#D8DCD1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        self.setStrokeColor(colors.HexColor("#D8DCD1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        self.drawString(54, 32, "Professional Training I (PT1) — Academic & Technical Architecture Documentation")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()

def generate_pdf(filename="VERDANT_Technical_Project_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom palette
    c_forest = colors.HexColor("#183D32")
    c_ink = colors.HexColor("#202822")
    c_sage = colors.HexColor("#A8B9A0")
    c_chartreuse = colors.HexColor("#D5EE75")
    c_border = colors.HexColor("#D8DCD1")
    c_bg_panel = colors.HexColor("#F6F3EB")
    c_terracotta = colors.HexColor("#C66D51")

    # Typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_forest,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#555555"),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=c_forest,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_forest,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_ink,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_ink,
        leftIndent=14,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=c_forest
    )

    story = []

    # Title Banner
    story.append(Paragraph("VERDANT — Personal Finance, Intentionally Planned", title_style))
    story.append(Paragraph("Comprehensive Technical Architecture, Methodology, Implementation Details & Future Improvements", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_forest, spaceBefore=0, spaceAfter=12))

    # Executive Overview
    story.append(Paragraph("1. Executive & Academic Project Summary", h1_style))
    exec_summary = (
        "<b>Academic Project Title:</b> AI-Based Personalised Savings and Financial Planning System<br/>"
        "<b>Product Name:</b> VERDANT — Personal Finance, Intentionally Planned<br/>"
        "<b>Course Context:</b> Professional Training I (PT1) Project Review<br/>"
        "<b>System Objective:</b> Build a presentation-ready, fully functional full-stack web application that "
        "synthesizes an individual's income, expenses, spending patterns, and multi-horizon financial goals into a "
        "personalised savings plan. The core philosophy is <b>mathematical integrity</b>: rule-based budget constraints "
        "govern all allocations, preventing AI hallucinations while an LLM provides contextual qualitative synthesis."
    )
    story.append(Paragraph(exec_summary, body_style))
    story.append(Spacer(1, 8))

    # Tech Stack Table
    story.append(Paragraph("2. Technology Stack & Tools Used", h1_style))
    tech_data = [
        [Paragraph("<b>Layer / Component</b>", body_style), Paragraph("<b>Technology Used</b>", body_style), Paragraph("<b>Rationale & Architectural Purpose</b>", body_style)],
        [Paragraph("<b>Frontend Framework</b>", body_style), Paragraph("React 19, TypeScript, Vite", body_style), Paragraph("Modern reactive component architecture with high type safety and sub-second HMR.", body_style)],
        [Paragraph("<b>Styling & Aesthetics</b>", body_style), Paragraph("Tailwind CSS, Google Fonts", body_style), Paragraph("'The Living Ledger' editorial aesthetic (Instrument Serif, Plus Jakarta Sans, JetBrains Mono).", body_style)],
        [Paragraph("<b>Data Visualisation</b>", body_style), Paragraph("Recharts", body_style), Paragraph("Interactive SVG charts for cash-flow waterfall bars, category distributions, and 12-month wealth roadmap.", body_style)],
        [Paragraph("<b>Iconography</b>", body_style), Paragraph("Lucide React", body_style), Paragraph("Consistent, minimalist technical icons for transactions, drawer triggers, and notifications.", body_style)],
        [Paragraph("<b>Backend Server</b>", body_style), Paragraph("Python 3.12, Flask, Flask-CORS", body_style), Paragraph("Lightweight, robust WSGI REST API facilitating rapid financial math and database orchestration.", body_style)],
        [Paragraph("<b>Persistence & DB</b>", body_style), Paragraph("SQLite (verdant.db)", body_style), Paragraph("Embedded relational database with foreign key support; zero config for student laptop demos.", body_style)],
        [Paragraph("<b>AI / LLM Integration</b>", body_style), Paragraph("Hybrid LLM API + Deterministic Fallback", body_style), Paragraph("OpenAI GPT-4o-mini API integration with fallback to rule-based editorial wealth synthesis engine.", body_style)],
        [Paragraph("<b>Verification & QA</b>", body_style), Paragraph("Python Unittest, Vite Production Build", body_style), Paragraph("Unit testing of waterfall allocations, surplus bounds, and static TypeScript bundle checks.", body_style)],
    ]
    t_tech = Table(tech_data, colWidths=[120, 140, 244])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_bg_panel),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_tech)
    story.append(Spacer(1, 10))

    # What Was Done: The 5 PPT Modules
    story.append(Paragraph("3. Implementation Architecture — The Five Core Modules", h1_style))
    
    story.append(Paragraph("<b>Module 1: User Profile & Financial Overview</b>", h2_style))
    story.append(Paragraph("• Implemented user account persistence storing monthly take-home income, fixed obligations, variable commitments, existing liquid savings, and debt schedules.", bullet_style))
    story.append(Paragraph("• Built an academic review demo profile (Arjun Verma): ₹50,000 income, ₹15,000 fixed, ₹10,000 variable, ₹3,000 debt obligations, and ₹40,000 existing savings.", bullet_style))
    story.append(Paragraph("• Dynamically computes <b>Net Monthly Surplus = ₹22,000</b> (44% savings rate) and 1.6 months of emergency runway.", bullet_style))

    story.append(Paragraph("<b>Module 2: Expense Tracking & Categorisation</b>", h2_style))
    story.append(Paragraph("• Refined double-entry style ledger table tracking amount, date, category, description, and payment method.", bullet_style))
    story.append(Paragraph("• Categorised across 10 sectors (Housing, Food, Utilities, Transport, Healthcare, Entertainment, Shopping, Debt, Education, Other).", bullet_style))
    story.append(Paragraph("• Classifies expenses into Essential Needs (50% benchmark) vs Discretionary Wants (30% benchmark) to detect expenditure leakage.", bullet_style))
    story.append(Paragraph("• Integrated full CRUD operations with live category aggregation updating the dashboard instantly.", bullet_style))

    story.append(Paragraph("<b>Module 3: Financial Goal Management</b>", h2_style))
    story.append(Paragraph("• Tracks multi-horizon goals (Emergency Funds, Higher Education, Travel, Electronics, Debt Clearance).", bullet_style))
    story.append(Paragraph("• Dynamically calculates remaining financial gap, completion %, target horizon in months, and required monthly velocity.", bullet_style))
    story.append(Paragraph("• Built an interactive contribution logger with celebratory notifications upon reaching 100% funding.", bullet_style))
    story.append(Paragraph("• <b>Overcommitment Detection:</b> Flags unrealistic milestones if total monthly demand exceeds the verified surplus ceiling.", bullet_style))

    story.append(Paragraph("<b>Module 4: AI-Assisted Strategic Savings Plan Generator (Core Feature)</b>", h2_style))
    story.append(Paragraph("• Features an engaging 7-stage analytical generation pipeline showcasing real-time data processing.", bullet_style))
    story.append(Paragraph("• <b>Mathematical Guarantee:</b> Allocations are bounded such that Sum(Allocated_i) ≤ Net Monthly Surplus. No double counting of debt.", bullet_style))
    story.append(Paragraph("• Simulates a 12-month forward cumulative savings roadmap detailing exact monthly balance progressions per goal.", bullet_style))
    story.append(Paragraph("• Generates discretionary spending trim recommendations and a concrete 30-day tactical execution checklist.", bullet_style))
    story.append(Paragraph("• Contextual editorial commentary powered by OpenAI GPT-4o-mini or the deterministic wealth synthesis engine.", bullet_style))

    story.append(Paragraph("<b>Module 5: Progress Monitoring & Plan Adjustment</b>", h2_style))
    story.append(Paragraph("• Revision audit system storing previous plan states in SQLite with active flag management.", bullet_style))
    story.append(Paragraph("• <b>Plan Adjustment Diff:</b> Compares changes between revisions, quantifying surplus deltas (e.g. -₹2,000), milestone delays, and allocation shifts.", bullet_style))
    story.append(Paragraph("• Persistent in-app notifications drawer tracking budget thresholds, milestone alerts, and large outflow warnings.", bullet_style))

    story.append(Spacer(1, 8))

    # Mathematical Formulations
    story.append(Paragraph("4. Mathematical Formulation & Algorithmic Design", h1_style))
    math_text = (
        "<b>1. Monthly Net Surplus Formulation:</b><br/>"
        "<code>Surplus = Monthly_Income - (Fixed_Expenses + Variable_Expenses) - Debt_Obligations</code><br/>"
        "<i>Ensures debt payments are explicitly accounted for and not duplicated if already included in fixed expenses.</i><br/><br/>"
        "<b>2. Goal Priority & Allocation Weighting:</b><br/>"
        "<code>Score_i = Priority_Weight_i * (10 / (Months_Remaining_i + 1))</code><br/>"
        "<i>High Priority = 3x (Emergency Funds receive +2 extra emergency weight), Medium = 2x, Low = 1x. Allocations are capped at each goal's ideal monthly requirement to prevent overfunding while starving secondary goals.</i><br/><br/>"
        "<b>3. 50/30/20 Classical Wealth Benchmark:</b><br/>"
        "Needs = 0.50 * Income | Wants = 0.30 * Income | Savings Target = 0.20 * Income."
    )
    story.append(Paragraph(math_text, body_style))
    story.append(Spacer(1, 10))

    # What Could Be Improved
    story.append(Paragraph("5. Future Scope & Potential Improvements", h1_style))
    improvements = [
        ("<b>1. Automated Bank Feed Integration (Account Aggregator / Plaid / Setu):</b>", 
         "Currently, transactions and baseline amounts are user-logged or seeded. Integrating standard Account Aggregator (AA) APIs under RBI guidelines would enable automated bank statement ingestion and real-time expense reconciliation without manual entry."),
        
        ("<b>2. Inflation & Dynamic Compound Yield Projections:</b>", 
         "The current 12-month simulation assumes constant currency value and zero or conservative yields. Incorporating inflation adjustments (e.g. 6% CPI) alongside risk-adjusted returns (Fixed Deposits, Debt Funds, Equity Mutual Funds) would deliver higher-fidelity long-term wealth trajectories."),
        
        ("<b>3. Machine Learning Categorisation Engine (Local NLP / Embeddings):</b>", 
         "Replace rule-based category matching with a fine-tuned lightweight local NLP model (e.g. FastText or MiniLM) to categorize cryptic merchant descriptions (e.g., 'UPI-ZEPTO-DELHI-023') with high precision."),
        
        ("<b>4. Multi-User Authentication & JWT Security:</b>", 
         "While basic secure password hashing (scrypt) is present, the app is currently optimized for seamless student demonstration with a 1-click demo account. Adding JWT bearer tokens, OAuth2 (Google/GitHub), and email verification would elevate it to commercial SaaS readiness."),
        
        ("<b>5. Push Notifications & Weekly WhatsApp/Telegram Digests:</b>", 
         "Extend the current in-app notification drawer with web push notifications or a scheduled Telegram/WhatsApp bot to alert users of weekly spending velocity before budgets are breached.")
    ]

    for title, desc in improvements:
        story.append(Paragraph(title, h2_style))
        story.append(Paragraph(desc, body_style))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at {filename}")

if __name__ == "__main__":
    generate_pdf()
