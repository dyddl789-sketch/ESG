package com.esg.platform;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BackendApplicationTests {

    @Test
    void projectLoadsAsPlainJavaTest() {
        assertThat(BackendApplication.class).isNotNull();
    }
}
