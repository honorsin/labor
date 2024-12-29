package labor

import (
	"io/ioutil"
	"net/http/httptest"
	"syscall/js"
)

type ResponseRecorder struct {
	*httptest.ResponseRecorder
}

func NewResponseRecorder() ResponseRecorder {
	return ResponseRecorder{httptest.NewRecorder()}
}


func (rr ResponseRecorder) JSValue() js.Value {
    res := rr.Result()
    
    // Create a proper JS Response object
    jsResponse := js.Global().Get("Object").New()
    
    // Handle body
    if res.ContentLength != 0 {
        b, _ := ioutil.ReadAll(res.Body)
        uint8Array := js.Global().Get("Uint8Array").New(len(b))
        js.CopyBytesToJS(uint8Array, b)
        jsResponse.Set("body", uint8Array)
    }

    // Handle headers
    headers := js.Global().Get("Object").New()
    for k, v := range res.Header {
        if len(v) > 0 {
            headers.Set(k, v[0])
        }
    }
    jsResponse.Set("headers", headers)
    
    // Set status
    jsResponse.Set("status", res.StatusCode)

    return jsResponse
}
