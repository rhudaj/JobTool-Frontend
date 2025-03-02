// NOTE: all units are in cqw (custom quarter width)
const BASE_SIZE = 0.26;

type StyleKeys =
	| "page_padding_sides"
	| "page_padding_top"
	| "hr_line_width"
	| "exp_indent"
	| "link_col_gap"
	| "text_line_height"
	| "sec_row_gap"
	| "sec_head_line_gap"
	| "sec_head_line_height"
	| "p_font"
	| "name_font";

const get_style = (val: number) => `${val * BASE_SIZE}cqw`;

export class StyleManager {
	static styles = {
		page_padding_sides: 25,
		page_padding_top: 20,
		hr_line_width: 0.5,
		exp_indent: 2.5,
		link_col_gap: 3,
		text_line_height: 7,
		sec_row_gap: 6,
		sec_head_line_gap: 3,
		sec_head_line_height: 0.5,
		p_font: 6,
		name_font: 12,
	};

	// Getter: Returns the computed style as a string
	static get(key: StyleKeys): string {
		return get_style(StyleManager.styles[key]);
	}

	// Setter: Updates the value
	static set(key: StyleKeys, value: number): void {
		StyleManager.styles[key] = value;
	}

	// Get all computed styles
	static getAll(): Record<StyleKeys, string> {
		return Object.fromEntries(
			Object.entries(StyleManager.styles).map(([key, val]) => [key, get_style(val as number)])
		) as Record<StyleKeys, string>;
	}
}

// Define dynamic getters & setters manually (No static block)
Object.keys(StyleManager.styles).forEach((key) => {
	Object.defineProperty(StyleManager, key, {
		get: () => StyleManager.get(key as StyleKeys),
		set: (value: number) => StyleManager.set(key as StyleKeys, value),
		enumerable: true,
	});
});
