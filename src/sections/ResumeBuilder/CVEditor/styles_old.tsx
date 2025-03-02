import { createContext } from "react";
import { create } from "zustand";

// NOTE: all units are in cqw (custom quarter width)
const BASE_SIZE = 0.26;
// All these values are
let defaultStyleVals = {
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
}
type StyleKeys = keyof typeof defaultStyleVals;

const get_style = (val: number) => `${val * BASE_SIZE}cqw`;

type StyleStore = {
	styleVals: typeof defaultStyleVals;
	getComputedStyles: () => Record<StyleKeys, string>;
	updateStyle: (key: StyleKeys, value: number) => void;
};

export const useStyleStore = create<StyleStore>((set, get) => ({
	styleVals: defaultStyleVals,
	getComputedStyles: () => {
		const { styleVals } = get();
		return Object.fromEntries(
			Object.entries(styleVals).map(([key, val]) => [key, get_style(val as number)])
		) as Record<StyleKeys, string>;
	},
	updateStyle: (key, value) => set((state) => ({
		styleVals: { ...state.styleVals, [key]: value },
	})),
}));
