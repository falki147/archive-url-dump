# archive-url-dump
This tool downloads all URLs (as well as timestamp, HTTP status code and MIME type) from [web.archive.org](//web.archive.org) for a given domain.

## Usage
`archive-url-dump -d <Domain> -o <Destination>`

See `archive-url-dump -h` for more options.

## Output
The inidividual requests to web.archive.org's API are stored in individual JSON files.

### Example
The first element of the array is always the description of the elements, the last two elements are always an empty array and the key (used for resuming the download) except in the last file.
```
[
  [
    "urlkey",
    "timestamp",
    "original",
    "mimetype",
    "statuscode",
    "digest",
    "length"
  ],
  [
    "com,example)/",
    "20020120142510",
    "http://example.com:80/",
    "text/html",
    "200",
    "HT2DYGA5UKZCPBSFVCV3JOBXGW2G5UUA",
    "1792"
  ],
  [
    "com,example)/",
    "20020328012821",
    "http://www.example.com:80/",
    "text/html",
    "200",
    "UY3I2DT2AMWAY6DECFCFYMT5ZOTFHUCH",
    "481"
  ],
  ...
  [
    "com,example)/",
    "20120208165306",
    "http://www.example.com/",
    "warc/revisit",
    "-",
    "3I42H3S6NNFQ2MSVX7XZKYAYSCX5QBYJ",
    "393"
  ],
  [],
  [
    "com%2Cexample%29%2F+20120208165307"
  ]
]
```
