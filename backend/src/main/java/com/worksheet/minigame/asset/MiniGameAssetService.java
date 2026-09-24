package com.worksheet.minigame.asset;

import com.worksheet.auth.User;
import com.worksheet.minigame.MiniGameDefinitionAssetRepository;
import com.worksheet.shared.storage.MiniGameAssetStorage;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class MiniGameAssetService {
    private static final long MAX_SIZE = 10L * 1024 * 1024;
    private final MiniGameAssetRepository repository;
    private final MiniGameDefinitionAssetRepository definitionAssets;
    private final MiniGameAssetStorage storage;
    private final AssetContentInspector inspector;

    public MiniGameAssetService(MiniGameAssetRepository repository,
                                MiniGameDefinitionAssetRepository definitionAssets,
                                MiniGameAssetStorage storage, AssetContentInspector inspector) {
        this.repository = repository;
        this.definitionAssets = definitionAssets;
        this.storage = storage;
        this.inspector = inspector;
    }

    @Transactional
    public MiniGameAssetResponse store(User creator, MultipartFile file) {
        if (file == null || file.isEmpty()) throw badRequest("Asset file is required.");
        if (file.getSize() > MAX_SIZE) throw badRequest("Asset cannot exceed 10 MB.");
        byte[] bytes;
        try { bytes = file.getBytes(); }
        catch (IOException error) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read asset file.", error); }
        AssetContentInspector.InspectedAsset inspected = inspector.inspect(bytes);
        String key = UUID.randomUUID() + inspected.extension();
        storage.store(key, bytes);
        try {
            MiniGameAsset asset = repository.save(new MiniGameAsset(creator, safeName(file.getOriginalFilename()),
                key, inspected.contentType(), bytes.length, sha256(bytes)));
            return response(asset);
        } catch (RuntimeException error) {
            storage.delete(key);
            throw error;
        }
    }

    public MiniGameAssetContent load(Long id) {
        MiniGameAsset asset = requireActive(id);
        return new MiniGameAssetContent(storage.load(asset.getStorageKey()), asset.getContentType(), asset.getOriginalFilename());
    }

    public MiniGameAsset requireActive(Long id) {
        return repository.findByIdAndStatus(id, MiniGameAssetStatus.ACTIVE)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found."));
    }

    @Transactional
    public void delete(Long id) {
        MiniGameAsset asset = requireActive(id);
        if (definitionAssets.existsByAsset_Id(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Asset is referenced by a mini-game definition.");
        }
        storage.delete(asset.getStorageKey());
        asset.markDeleted();
        repository.save(asset);
    }

    private MiniGameAssetResponse response(MiniGameAsset asset) {
        String url = asset.getStatus() == MiniGameAssetStatus.ACTIVE
            ? "/api/minigame-assets/" + asset.getId() + "/content" : null;
        return new MiniGameAssetResponse(asset.getId(), asset.getOriginalFilename(), asset.getContentType(),
            asset.getSizeBytes(), asset.getSha256(), asset.getStatus(), url, asset.getCreatedAt());
    }

    private String safeName(String name) {
        String safe = name == null ? "asset" : name.replace('\\', '/');
        safe = safe.substring(safe.lastIndexOf('/') + 1).trim();
        if (safe.isEmpty()) safe = "asset";
        return safe.length() > 255 ? safe.substring(safe.length() - 255) : safe;
    }

    private String sha256(byte[] bytes) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (NoSuchAlgorithmException impossible) { throw new IllegalStateException("SHA-256 is unavailable.", impossible); }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
