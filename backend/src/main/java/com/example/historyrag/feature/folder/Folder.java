package com.example.historyrag.feature.folder;

import com.example.historyrag.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "folder")
public class Folder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "folder_id", nullable = false)
    private Long id;

    @Size(max = 255)
    @NotNull
    @Column(name = "folder_name", nullable = false)
    private String folderName;

    @NotNull
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;
}
