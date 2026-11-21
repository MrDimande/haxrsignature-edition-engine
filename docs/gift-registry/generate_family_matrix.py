"""Build the editable Family Approval Matrix from the candidate TypeScript source."""

from __future__ import annotations

import re
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "data" / "gifts" / "baby-aylla.ts"
OUTPUT = Path(__file__).with_name("Baby-Aylla-Matriz-de-Aprovacao-Familiar.docx")
PRESENTATION = Path(__file__).with_name("Baby-Aylla-Apresentacao-Familia.html")

CATEGORIES = [
    ("cantinho-dos-sonhos", "O Cantinho dos Sonhos da Aylla"),
    ("guarda-roupa", "O Guarda-Roupa da Aylla"),
    ("bonecas-companhia", "Bonecas & Companhia"),
    ("descobrir-aprender", "Descobrir & Aprender"),
    ("brincar-explorar", "Brincar & Explorar"),
    ("pequenos-essenciais", "Pequenos Essenciais"),
    ("tesouros-recordacoes", "Tesouros & Recordações"),
]

PATTERN = re.compile(
    r'candidate\("(?P<id>[^"]+)", "(?P<name>[^"]+)", "(?P<category>[^"]+)", '
    r'"(?P<description>[^"]+)", "(?P<priority>high|standard)"(?:, \[(?P<flags>[^\]]*)\])?\),'
)


def shade(cell, color: str) -> None:
    properties = cell._tc.get_or_add_tcPr()
    fill = OxmlElement("w:shd")
    fill.set(qn("w:fill"), color)
    properties.append(fill)


def set_cell_text(cell, value: str, bold: bool = False, color: str = "493332", size: float = 7.5) -> None:
    cell.text = ""
    paragraph = cell.paragraphs[0]
    paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
    paragraph.paragraph_format.space_after = Pt(0)
    run = paragraph.add_run(value)
    run.bold = bold
    run.font.name = "Aptos"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    header = OxmlElement("w:tblHeader")
    header.set(qn("w:val"), "true")
    tr_pr.append(header)


def make_title(document: Document, text: str, subtitle: str | None = None) -> None:
    paragraph = document.add_paragraph(style="Title")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run(text)
    run.font.name = "Georgia"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Georgia")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Georgia")
    run.font.color.rgb = RGBColor(74, 49, 48)
    if subtitle:
        p = document.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(20)
        run = p.add_run(subtitle)
        run.font.name = "Aptos"
        run._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
        run._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(151, 104, 94)


def parse_candidates():
    candidates = []
    for match in PATTERN.finditer(SOURCE.read_text(encoding="utf-8")):
        candidates.append(match.groupdict())
    if len(candidates) != 52:
        raise RuntimeError(f"Expected 52 candidates, found {len(candidates)}")
    return candidates


def main() -> None:
    candidates = parse_candidates()
    document = Document()
    section = document.sections[0]
    section.orientation = WD_ORIENT.LANDSCAPE
    section.page_width, section.page_height = Inches(11), Inches(8.5)
    section.top_margin = section.bottom_margin = Inches(0.55)
    section.left_margin = section.right_margin = Inches(0.45)

    normal = document.styles["Normal"]
    normal.font.name = "Aptos"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    normal.font.size = Pt(9)

    make_title(document, "Baby Aylla Gift Registry", "Matriz de Aprovação Familiar · ÉDITION ROSE · Fase B")
    intro = document.add_paragraph()
    intro.alignment = WD_ALIGN_PARAGRAPH.CENTER
    intro.paragraph_format.space_after = Pt(12)
    intro.add_run(
        "52 presentes candidatos organizados para decisão familiar. Nenhum artigo está aprovado, "
        "activo, reservado ou exposto no catálogo público."
    ).italic = True

    details = document.add_table(rows=3, cols=2)
    details.alignment = WD_TABLE_ALIGNMENT.CENTER
    details.style = "Table Grid"
    for row, (label, value) in zip(details.rows, [
        ("Celebração", "Primeiro aniversário da Baby Aylla · 23 de Janeiro de 2027 · 11h00"),
        ("Local", "Vila do Mar Eventos · Maputo"),
        ("Como aprovar", "Preencher quantidade, tamanho, cor, especificações, referência visual e decisão familiar."),
    ]):
        set_cell_text(row.cells[0], label, True, "FFFFFF", 9)
        shade(row.cells[0], "8D625A")
        set_cell_text(row.cells[1], value, False, "493332", 9)
        shade(row.cells[1], "FBF5EF")

    note = document.add_paragraph()
    note.paragraph_format.space_before = Pt(12)
    note.paragraph_format.space_after = Pt(12)
    note.add_run("Nota de segurança. ").bold = True
    note.add_run(
        "Itens assinalados em Pendências exigem confirmação de segurança, supervisão, dimensões, "
        "tamanho, material ou personalização antes de qualquer activação."
    )

    columns = ["ID", "Artigo", "Prioridade", "Qtd. sugerida", "Qtd. aprovada", "Tamanho", "Cor", "Especificações e imagem", "Decisão", "Activar", "Observações"]
    widths = [1.25, 1.55, 0.55, 0.65, 0.65, 0.55, 0.55, 1.55, 0.7, 0.55, 0.95]

    for category_id, category_name in CATEGORIES:
        document.add_page_break()
        heading = document.add_heading(category_name, level=1)
        heading.runs[0].font.color.rgb = RGBColor(116, 75, 67)
        category_candidates = [candidate for candidate in candidates if candidate["category"] == category_id]
        subtitle = document.add_paragraph(f"{len(category_candidates)} candidatos · aprovação familiar pendente")
        subtitle.runs[0].italic = True
        subtitle.runs[0].font.color.rgb = RGBColor(151, 104, 94)

        table = document.add_table(rows=1, cols=len(columns))
        table.style = "Table Grid"
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        header = table.rows[0]
        set_repeat_table_header(header)
        for index, label in enumerate(columns):
            header.cells[index].width = Inches(widths[index])
            set_cell_text(header.cells[index], label, True, "FFFFFF", 6.7)
            shade(header.cells[index], "8D625A")

        for index, item in enumerate(category_candidates):
            row = table.add_row()
            values = [
                item["id"], item["name"], "Alta" if item["priority"] == "high" else "Normal",
                "Pendente", "Pendente", "Pendente", "Pendente",
                "Pendente" + (" · " + item["flags"].replace('"', "") if item["flags"] else ""),
                "Pendente", "Não", "",
            ]
            for cell_index, value in enumerate(values):
                set_cell_text(row.cells[cell_index], value, size=6.5)
                if index % 2 == 1:
                    shade(row.cells[cell_index], "FCF7F2")

    document.add_page_break()
    document.add_heading("Observações da Família", level=1)
    document.add_paragraph(
        "Use este espaço para indicar marcas, referências, links, fotografias, dimensões, escolhas de cor "
        "ou qualquer alteração desejada antes da próxima fase."
    )
    for _ in range(12):
        document.add_paragraph("________________________________________________________________________________")

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.add_run("HAXR Signature · Alta-Costura Digital · Matriz privada de aprovação familiar")
    footer.runs[0].font.size = Pt(8)
    footer.runs[0].font.color.rgb = RGBColor(132, 99, 91)
    document.save(OUTPUT)
    build_presentation(candidates)
    print(OUTPUT)
    print(PRESENTATION)


def build_presentation(candidates) -> None:
    sections = []
    for category_id, category_name in CATEGORIES:
        items = [candidate for candidate in candidates if candidate["category"] == category_id]
        cards = "".join(
            "<article class='item'>"
            f"<p class='id'>{item['id']}</p><h3>{item['name']}</h3>"
            f"<p>{item['description']}</p><small>Prioridade: {'Elevada' if item['priority'] == 'high' else 'Normal'} · Estado: Pendente</small>"
            "</article>"
            for item in items
        )
        sections.append(
            f"<section><p class='eyebrow'>{len(items):02d} candidatos</p><h2>{category_name}</h2><div class='grid'>{cards}</div></section>"
        )
    html = """<!doctype html>
<html lang='pt'>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>
<title>Baby Aylla Gift Registry Fase B</title>
<style>
@page { size: A4; margin: 15mm; }
* { box-sizing: border-box; } body { margin: 0; background: #f7efe8; color: #493332; font-family: Georgia, serif; }
main { width: min(1040px, calc(100% - 32px)); margin: 0 auto; padding: 48px 0 72px; }
.cover, section { background: #fffaf6; border: 1px solid #decabb; box-shadow: 0 18px 45px #6c403118; padding: clamp(24px,5vw,56px); margin-bottom: 28px; }
.cover { text-align: center; background: radial-gradient(circle at 50% 5%, #fffefa, #f7e4d8 68%, #f2d7ca); }
.monogram { margin: 0 auto 20px; border: 1px solid #b88a7f; border-radius: 999px; width: 58px; height: 58px; display:grid; place-items:center; color:#a16d60; font-size:34px; }
.eyebrow { color:#a16d60; letter-spacing:.19em; font: 10px Arial, sans-serif; text-transform:uppercase; margin:0 0 12px; } h1 { font-size: clamp(38px, 7vw, 70px); margin:0; font-weight:400; } h2 { font-size:clamp(28px,4vw,42px); font-weight:400; margin:0 0 26px; color:#744b43; } h3 { font-size:18px; font-weight:400; margin:6px 0 10px; } .lead { max-width:620px; margin:22px auto 0; font-size:19px; line-height:1.7; } .rule { width:90px; height:1px; margin:25px auto; background:#c9a48f; }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:14px; }.item { border:1px solid #ead8ca; padding:18px; background:#fffdfa; min-height:180px; }.item p { font-size:14px; line-height:1.55; margin:0 0 12px; }.item .id { color:#a16d60; font:9px Arial,sans-serif; letter-spacing:.12em; }.item small { font:10px Arial,sans-serif; color:#85655b; }
.note { max-width:720px; margin:25px auto 0; color:#76584d; font-size:14px; line-height:1.7; }.footer { text-align:center; color:#8a655a; font:11px Arial,sans-serif; letter-spacing:.12em; margin-top:42px; }
@media print { body { background:white; } main { width:100%; padding:0; } .cover, section { box-shadow:none; break-inside:avoid; } }
</style></head><body><main>
<section class='cover'><div class='monogram'>A</div><p class='eyebrow'>HAXR Gift Registry · ÉDITION ROSE</p><h1>Pequenos Mimos<br>para Aylla</h1><div class='rule'></div><p class='lead'>Uma selecção em curadoria para os primeiros sonhos da Aylla. Estes 52 presentes são candidatos para validação familiar e ainda não estão activos, aprovados ou disponíveis para reserva.</p><p class='note'>O Cantinho dos Sonhos da Aylla tem prioridade editorial. Tamanhos, quantidades, cores, referências visuais, marcas e especificações serão decididos pela família.</p></section>
""" + "\n".join(sections) + """<p class='footer'>HAXR Signature · Alta-Costura Digital · Apresentação privada para aprovação familiar</p></main></body></html>"""
    PRESENTATION.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
