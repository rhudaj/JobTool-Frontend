// NOTE: all units are in cqw (custom quarter width)
const BASE_FONT_SIZE = 0.26;
const get_style = (val: number) => `${val * BASE_FONT_SIZE}cqw`;

// All these values are
const style_vals = {
	page_padding_sides: 25,
	page_padding_top: 20,
	sections_row_gap: 5,
	hr_line_width: 0.5,
	experiences_gap: 5,
	exp_row_gap: 5,
	exp_col_gap: 5,
	exp_head_content_gap: 5,
	exp_indent: 2.5,
	link_col_gap: 3,
	skills_col_gap: 3,
	bullet_point_gap: 3,
	text_line_height: 7,
	sec_row_gap: 6,
	sec_head_line_gap: 3,
	sec_head_line_height: 0.5,
	p_font: 6,
	name_font: 12,
	title_font: 8
}

export const Styles = Object.fromEntries(
	Object.entries(style_vals).map(([key, val]) => [key, get_style(val)])
) as Record<keyof typeof style_vals, string>;