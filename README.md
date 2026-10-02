# Spicy

Source for the Spicy website: the landing page and the documentation.

The site is published at [spicy.akorede.dev](https://spicy.akorede.dev). Spicy itself, the point of sale, lives in [sanusi-dev/spicy](https://github.com/sanusi-dev/spicy).

## Run it locally

```bash
python3 -m http.server 8899
```

Open [http://localhost:8899/](http://localhost:8899/).

## Editing

The landing page is `index.html`, with styles in `assets/css/landing.css` and behavior in `assets/js/landing.js`.

Documentation is one folder per page (`introduction/`, `installation/`, `pos/`, and the rest). `docs/index.html` is the hub that links them. A documentation page uses `landing.css`, `docs.css`, and `landing.js`.

For a typo or a small correction, edit the file and open a pull request.

## License

[MIT](LICENSE)
