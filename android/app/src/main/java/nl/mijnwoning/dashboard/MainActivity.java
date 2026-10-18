package nl.mijnwoning.dashboard;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HueBridgePlugin.class);
        registerPlugin(ShellyPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
