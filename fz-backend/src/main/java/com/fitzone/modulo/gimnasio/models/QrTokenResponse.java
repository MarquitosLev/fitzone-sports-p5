package com.fitzone.modulo.gimnasio.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrTokenResponse {

    private String tokenQr;
    private Long segundosRestantes;
}
