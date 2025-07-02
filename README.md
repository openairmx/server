# The mock server for AIRMX Pro

[![Test](https://github.com/openairmx/server/actions/workflows/test.yml/badge.svg)](https://github.com/openairmx/server/actions/workflows/test.yml)
[![MIT License](https://img.shields.io/github/license/openairmx/server)](https://github.com/openairmx/server)

This repository contains a mock server used to enable AIRMX Pro devices to
communicate. The server allows devices to register themselves with an MQTT
server, periodically synchronize the date and time, and facilitate device
pairing.

> [!WARNING]
> Due to the lack of the authentication feature, the code is expected to be run
> on your internal network.

## Usage

We’re keeping things simple at heart while building it; the server has zero
dependencies, so we don’t need to install anything. All you need is to spin
up the server with:

```
node server.mjs
```

You should see _Listening on 0.0.0.0:80_. To customize the listening host
or port, you can use the following two environment variables:

```
HOSTNAME="127.0.0.1" PORT=8080 node server.mjs
```

## Endpoints

<dl>
  <dt>GET /gettime</dt>
  <dd>
    From time to time, your AIRMX Pro will hit this endpoint to update its
    local datetime, and we’re simply returning the current timestamp in
    seconds back to the device.
  </dd>

  <dt>GET /eagle?path=eagle/GET/genId</dt>
  <dd>
    During the pairing process, when the device receives the Wi-Fi credentials
    you provide, it registers itself with this endpoint along with its MAC
    address and encryption key, which is the token that allows you to control
    your device remotely later. We store this device information in an
    in-memory SQLite database and wait for you to exchange your device key at
    the final stage of the pairing process.
  </dd>

  <dt>GET /eagle?path=eagle/GET/online</dt>
  <dd>
    <p>The device will access this endpoint immediately after it receives the
    Wi-Fi credentials during the pairing process. Based on the hints from
    the path name and payload, we believe this endpoint allows the device to
    determine if it has successfully connected to the AIRMX network.</p>
    <p>Therefore, regardless of the parameters the API receives, we will
    always provide it with a predetermined response, making it appear as
    though the air monitor and the AIRMX Pro unit are already connected.</p>
  </dd>

  <dt>GET /exchange</dt>
  <dd>
    To streamline device pairing, we introduce an unofficial API that enables
    you to directly retrieve your device key from the browser. However, it's
    crucial to understand that this API lacks authentication and will exchange
    your device encryption key based solely on the device ID.
  </dd>
</dl>

## License

The code is released under [the MIT license](LICENSE.md).
