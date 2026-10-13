package com.worksheet.minigame;

import java.util.Set;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.JsonNodeFactory;
import tools.jackson.databind.node.ObjectNode;

/** Additive photo contract shared by startup seeds and the populated-database upgrade. */
public final class BuiltinPhotoConfiguration {
    public static final int VERSION = 3;
    public static final Set<String> TYPES = Set.of("math-game", "sequence-game", "higher-lower-game",
        "odd-even-game", "color-game", "matching-game");

    private BuiltinPhotoConfiguration() {}

    public static ObjectNode schema(String type, JsonNode original) {
        ObjectNode schema = (ObjectNode) original.deepCopy();
        ObjectNode properties = (ObjectNode) schema.get("properties");
        properties.set("imageAssetId", photoField());
        ObjectNode slots = schema.has("x-image-slots")
            ? (ObjectNode) schema.get("x-image-slots") : schema.putObject("x-image-slots");
        slot(slots, "activity-photo", "/imageAssetId", "Activity photo");
        String collection = type.equals("color-game") ? "animals" : type.equals("matching-game") ? "pairs" : null;
        if (collection != null) {
            ObjectNode item = (ObjectNode) properties.get(collection).get("items").get("properties");
            item.set("imageAssetId", photoField());
            slot(slots, "object-photo", "/" + collection + "/*/imageAssetId", "Object photo");
        }
        return schema;
    }

    public static ObjectNode defaults(JsonNode original) {
        ObjectNode defaults = (ObjectNode) original.deepCopy();
        defaults.putNull("imageAssetId");
        for (String key : new String[] {"animals", "pairs"}) {
            if (defaults.path(key).isArray())
                for (JsonNode item : defaults.get(key)) ((ObjectNode) item).putNull("imageAssetId");
        }
        return defaults;
    }

    private static ObjectNode photoField() {
        ObjectNode field = JsonNodeFactory.instance.objectNode();
        field.putArray("type").add("integer").add("null");
        field.put("minimum", 1);
        field.putNull("default");
        return field;
    }

    private static void slot(ObjectNode slots, String key, String path, String label) {
        ObjectNode slot = slots.putObject(key);
        slot.put("path", path);
        slot.put("label", label);
        slot.put("allowUpload", true);
        slot.putArray("variants");
    }
}
