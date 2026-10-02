# Spicy

Source for the Spicy website: the landing page and the documentation.

The site is published at [spicy.akorede.dev](https://spicy.akorede.dev), a subdomain of `akorede.dev` that both sit on Netlify. Spicy itself, the point of sale, lives in [sanusi-dev/spicy](https://github.com/sanusi-dev/spicy).

## Run it locally

```bash
python3 -m http.server 8899
```

Open [http://localhost:8899/](http://localhost:8899/).

## Editing

The landing page is `index.html`, with styles in `assets/css/landing.css` and behavior in `assets/js/landing.js`.

Documentation is one folder per page (`introduction/`, `installation/`, `pos/`, and the rest). `docs/index.html` is the hub that links them. Every documentation page shares the same shell: `landing.css` and `docs.css` for the styles, `landing.js` for the theme toggle and reveals, and `docs.js` for the header search.

For a typo or a small correction, edit the file and open a pull request.

## License

[MIT](LICENSE)
