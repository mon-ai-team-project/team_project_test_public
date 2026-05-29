# IEEE Template And PDF eXpress Checklist

Updated: 2026-05-29 (codex)

This checklist records how the final paper draft is aligned with the IEEE article template workflow and what remains before formal IEEE PDF eXpress submission.

## Official References

- IEEE Article Templates: https://journals.ieeeauthorcenter.ieee.org/create-your-ieee-journal-article/authoring-tools-and-templates/tools-for-ieee-authors/ieee-article-templates/
- IEEE PDF eXpress usage guide: https://ieee-pdf-express.org/External/UsingIEEEPDFeXpress
- Practical LaTeX/IEEE conference writing notes reviewed as secondary reference: https://sweetdev.tistory.com/1161

## Local Template Decision

The current TeX Live `scheme-small` environment does not include `IEEEtran.cls` or `acmart.cls`. To keep the paper build reproducible in this workspace, `paper/final-paper-draft.tex` now uses a stable IEEE-style conference draft layout:

- `10pt` two-column article layout
- letter paper with 0.75 inch margins
- title, author, abstract, and Index Terms block
- conference-paper section order: Abstract, Introduction, Related Work, Method, Evaluation, Results, Limitations, Conclusion

If the official IEEEtran class becomes available later, convert the preamble to:

```tex
\documentclass[conference]{IEEEtran}
```

Then remove the local geometry fallback and recompile.

## PDF eXpress Notes

IEEE PDF eXpress is a final compatibility check, not a replacement for local proofreading. Before submitting:

1. Confirm the conference provides a valid PDF eXpress Conference ID.
2. Proofread grammar, spelling, figures, and content before uploading.
3. Upload either the generated PDF for checking or a zipped LaTeX source package for conversion.
4. Review the PDF eXpress pass/fail report.
5. If PDF eXpress fails, fix the local LaTeX source and resubmit a revision, not a new title.

## Current Local Status

- Source: `paper/final-paper-draft.tex`
- Generated PDF: `paper/final-paper-draft.pdf`
- Local compile path: `pdflatex -interaction=nonstopmode -output-directory=paper paper/final-paper-draft.tex`
- Status: Local PDF generation is verified, but official IEEE PDF eXpress validation requires a conference account and Conference ID.

## Practical Authoring Notes

- Keep abbreviations defined on first use.
- Keep table and figure text close to body-text size.
- If the manuscript grows, split sections with `\input{...}` for maintainability.
- Add BibTeX only after the final used-paper list is frozen; protect title capitalization with braces where needed.
